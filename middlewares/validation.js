const Joi = require('joi');
// ethers is not used directly in this file

// Schéma de validation pour les adresses Ethereum
const addressSchema = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{40}$/)
  .message('doit être une adresse Ethereum valide');

// Schéma de validation pour les chaînes supportées
const chainSchema = Joi.string().custom((value, helpers) => {
  try {
    const config = require('../chains');
    if (!config[value] || !config[value].rpc) {
      return helpers.error('any.invalid');
    }
    return value;
  } catch (e) {
    return helpers.error('any.invalid');
  }
}, 'chaîne non supportée');

// Schéma de validation pour les montants
const amountSchema = Joi.alternatives()
  .try(Joi.number().positive(), Joi.string().pattern(/^[0-9]+(\.[0-9]+)?$/))
  .messages({
    'alternatives.types': 'doit être un nombre positif',
    'alternatives.match': 'doit être un nombre positif',
    'string.pattern.base': 'doit être un nombre positif',
    'number.positive': 'doit être un nombre positif',
  });

// Schéma pour la construction d'une transaction
const buildPaymentSchema = Joi.object({
  chain: chainSchema.required().messages({
    'any.required': 'Le paramètre chain est requis',
    'any.invalid': 'Chaîne non supportée ou non configurée',
  }),
  to: addressSchema.required().messages({
    'any.required': "L'adresse du destinataire est requise",
    'string.pattern.base': 'Adresse du destinataire invalide',
  }),
  amount: amountSchema.required().messages({
    'any.required': 'Le montant est requis',
    'alternatives.types': 'Le montant doit être un nombre positif',
    'alternatives.match': 'Format de montant invalide',
  }),
  tokenAddress: addressSchema.messages({
    'string.pattern.base': 'Adresse du token ERC-20 invalide',
  }),
});

// Schéma pour la diffusion d'une transaction
const broadcastSchema = Joi.object({
  chain: chainSchema.required().messages({
    'any.required': 'Le paramètre chain est requis',
    'any.invalid': 'Chaîne non supportée ou non configurée',
  }),
  signedTx: Joi.string()
    .pattern(/^0x[a-fA-F0-9]+$/)
    .required()
    .messages({
      'any.required': 'Le paramètre signedTx est requis',
      'string.pattern.base':
        'Transaction signée invalide. Doit être une chaîne hexadécimale commençant par 0x',
    }),
});

// Middleware de validation
const validate = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: 'Erreur de validation',
        details: errors,
      });
    }

    // Remplacer les valeurs validées
    req.validated = value;
    next();
  };
};

module.exports = {
  validateBuildPayment: validate(buildPaymentSchema),
  validateBroadcast: validate(broadcastSchema),
  schemas: {
    address: addressSchema,
    chain: chainSchema,
    amount: amountSchema,
  },
};
