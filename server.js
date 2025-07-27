/**
 * Point d'entrée du serveur
 * Ce fichier est utilisé pour démarrer le serveur en environnement de production
 */

// Charger les variables d'environnement le plus tôt possible
require('dotenv').config();

// Démarrer l'application
require('./app');
