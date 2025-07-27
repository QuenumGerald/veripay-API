const { JsonRpcProvider } = require('ethers');

const chains = require('../chains');

// Cache pour stocker les instances de provider
const providerCache = new Map();

/**
 * Obtient un provider JSON-RPC pour la chaîne spécifiée
 * @param {string} chain - Identifiant de la chaîne (ex: 'ethereum', 'polygon', 'bsc')
 * @returns {JsonRpcProvider} Instance du provider
 * @throws {Error} Si la chaîne n'est pas configurée ou si l'URL RPC n'est pas définie
 */
function getProvider(chain) {
  // Vérifier si la chaîne existe dans la configuration
  const chainConfig = chains[chain.toLowerCase()];
  if (!chainConfig) {
    throw new Error(`Chaîne non supportée: ${chain}. Vérifiez votre configuration dans chains.js`);
  }

  // Vérifier si l'URL RPC est définie
  if (!chainConfig.rpc) {
    throw new Error(
      `URL RPC non définie pour la chaîne ${chain}. Assurez-vous de définir la variable d'environnement appropriée (ex: ${chain.toUpperCase()}_RPC)`
    );
  }

  // Vérifier si un provider est déjà en cache pour cette chaîne
  if (providerCache.has(chainConfig.rpc)) {
    return providerCache.get(chainConfig.rpc);
  }

  // Créer un nouveau provider avec des options par défaut
  const providerOptions = {
    chainId: chainConfig.chainId,
    name: chainConfig.name || chain,
    // Désactive le cache du réseau pour éviter les appels réseau inutiles
    // car nous gérons déjà notre propre cache
    cacheTimeout: -1,
  };

  const provider = new JsonRpcProvider(chainConfig.rpc, providerOptions);

  // Mettre en cache le provider
  providerCache.set(chainConfig.rpc, provider);

  return provider;
}

/**
 * Obtient la configuration d'une chaîne spécifique
 * @param {string} chain - Identifiant de la chaîne
 * @returns {Object} Configuration de la chaîne
 */
function getChainConfig(chain) {
  const chainConfig = chains[chain.toLowerCase()];
  if (!chainConfig) {
    throw new Error(`Configuration de chaîne non trouvée: ${chain}`);
  }
  // Use Object.assign to create a shallow copy of the chain config
  return Object.assign({}, chainConfig); // Retourne une copie pour éviter les modifications accidentelles
}

module.exports = {
  getProvider,
  getChainConfig,
};
