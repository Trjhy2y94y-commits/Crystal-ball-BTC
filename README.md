# Cristal BTC

Application web progressive (PWA) d'analyse du marché Bitcoin, optimisée pour iPhone.

## Accès
- Application publiée : https://trjhy2y94y-commits.github.io/Crystal-ball-BTC/
- Dépôt : https://github.com/trjhy2y94y-commits/Crystal-ball-BTC

## Installation sur iPhone
1. Ouvrir l'adresse de l'application dans Safari.
2. Toucher **Partager** puis **Sur l'écran d'accueil**.
3. Valider avec **Ajouter**. L'application s'ouvre ensuite en mode autonome.

## Données et fonctionnement
- Prix et bougies : Binance Spot en source principale ; Coinbase en secours pour les unités prises en charge.
- Flux temps réel : WebSocket Binance, lorsqu'il est disponible.
- Dérivés : funding, open interest et ratio long/short via Binance Futures.
- Liquidité macro : source configurable dans les réglages (Worker Cloudflare facultatif).
- Si les sources de marché sont indisponibles, l'application affiche une série de démonstration clairement signalée. Ne pas interpréter cette démo comme un cours réel.

## Méthode et limites
Les scores, signaux, divergences, projections et backtests sont des outils d'analyse, pas des garanties ni des conseils financiers. Les résultats historiques peuvent être sensibles à la période et à la taille de l'échantillon. Les études de rendement brut ne représentent pas nécessairement un résultat net exécutable ; frais, spread, slippage, financement, fiscalité et contraintes de liquidité peuvent différer des hypothèses affichées.

La validation automatisée contrôle le manifeste, les ressources du service worker et la syntaxe JavaScript. Elle ne remplace pas un essai visuel sur un véritable iPhone/Safari.

## Publication
Les améliorations de la branche `chatgpt-improvements` sont proposées dans la PR #1. Elles ne deviennent publiques sur GitHub Pages qu'après fusion explicite dans `main`.
