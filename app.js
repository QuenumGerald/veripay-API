const express = require('express');
const bodyParser = require('body-parser');

require('dotenv').config();
const {
  buildPaymentPreview,
  broadcastSignedTransaction,
} = require('./controllers/paymentController');
const { validateBuildPayment, validateBroadcast } = require('./middlewares/validation');

// Configuration Varisense
const VARISENSE_CONFIG = {
  providerId: 'veripay',
  version: '1.0.0',
  features: ['payments', 'token-transfers'],
};

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json()); // Pour parser le JSON des requêtes
app.use(bodyParser.urlencoded({ extended: true })); // Pour parser les données de formulaire

// Route de santé pour les tests
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// Route pour Varisense - Récupérer les détails d'une transaction
app.post('/api/v1/transactions/prepare', validateBuildPayment, async (req, res) => {
  try {
    const { chain, to, amount, tokenAddress } = req.validated;
    const result = await buildPaymentPreview({
      chain,
      to,
      amount,
      tokenAddress,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        details: result.details,
      });
    }
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      process.stderr.write(`Erreur dans /api/v1/transactions/prepare: ${error.message}\n`);
    }
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la préparation de la transaction',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Route pour Varisense - Soumettre une transaction signée
app.post('/api/v1/transactions/submit', validateBroadcast, async (req, res) => {
  try {
    const { chain, signedTx } = req.validated;
    const result = await broadcastSignedTransaction(chain, signedTx);

    if (result.success) {
      res.status(200).json({
        success: true,
        status: 'broadcasted',
        transactionHash: result.txHash,
        receipt: result.receipt,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        status: 'error',
        error: result.error || 'Failed to broadcast transaction',
        details: result.details,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      process.stderr.write(`Erreur dans /api/v1/transactions/submit: ${error.message}\n`);
    }
    res.status(500).json({
      success: false,
      status: 'error',
      error: 'Erreur lors de la soumission de la transaction',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
    });
  }
});

// Route pour les informations sur le fournisseur
app.get('/api/v1/provider', (req, res) => {
  res.json({
    success: true,
    provider: {
      id: VARISENSE_CONFIG.providerId,
      name: 'VeriPay',
      version: VARISENSE_CONFIG.version,
      description: 'VeriPay Payment Gateway',
      features: VARISENSE_CONFIG.features,
      supportedChains: ['ethereum', 'polygon', 'bsc', 'avalanche', 'fantom'],
    },
    timestamp: new Date().toISOString(),
  });
});

// Route de santé de l'API
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: VARISENSE_CONFIG.version,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trouvé',
    path: req.path,
    method: req.method,
  });
});

// Gestion des erreurs globales
app.use((err, req, res, _next) => {
  // Log error in development only
  if (process.env.NODE_ENV === 'development') {
    process.stderr.write(`Erreur non gérée: ${err.message}\n`);
  }
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Démarrer le serveur
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    const env = process.env.NODE_ENV || 'development';
    // Only log in non-test environments
    if (env !== 'test') {
      // Using process.stdout.write for better control over logging
      const log = (...args) => process.stdout.write(`${args.join(' ')}`);
      log(`Serveur démarré sur le port ${PORT}\n`);
      log(`Environnement: ${env}\n`);
      log(`Health check: http://localhost:${PORT}/health\n`);
    }
  });

  // Gestion propre de l'arrêt du serveur
  process.on('SIGTERM', () => {
    if (process.env.NODE_ENV !== 'test') {
      process.stdout.write('Arrêt du serveur...\n');
    }
    server.close(() => {
      if (process.env.NODE_ENV !== 'test') {
        process.stdout.write('Serveur arrêté\n');
      }
      // In test environment, we can exit the process
      if (process.env.NODE_ENV === 'test') {
        // This is a special case for test environment
        // We need to exit the process to allow tests to complete
        // This is the only place where process.exit() is allowed
        // eslint-disable-next-line no-process-exit
        process.exit(0);
      }
    });
  });
}

module.exports = app;
