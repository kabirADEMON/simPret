# SimPrêt - Simulateur de Prêt Immobilier Premium

SimPrêt est une application interactive et élégante permettant d'estimer en quelques secondes les mensualités, le coût total et le tableau d'amortissement de votre crédit immobilier.

![Aperçu de SimPrêt](public/vite.svg) *(Vous pouvez ajouter une capture d'écran de l'application ici)*

## ✨ Fonctionnalités Clés

*   **Gestion flexible de la durée** : Saisissez votre durée d'emprunt en **années** ou en **mois** grâce au sélecteur d'unité intégré.
*   **Protection des calculs** : Les résultats et le tableau d'amortissement ne s'affichent que lorsque les paramètres essentiels (Prix et Durée) sont renseignés, assurant une expérience utilisateur propre et sans erreurs.
*   **Réinitialisation rapide** : Bouton **"Réinitialiser"** dans le header pour remettre tous les paramètres à zéro instantanément.
*   **Aide pédagogique** : Infobulles explicatives pour chaque paramètre financier (Taux, TAEA, Frais de notaire).
*   **Multi-devises** : Support complet de l'**Euro (€)**, du **Franc CFA (F)** et du **Dollar ($)** avec formatage localisé.
*   **Visualisation des données** : 
    *   Barres de ratio (Apport vs Emprunt, Capital vs Intérêts).
    *   Tableau d'amortissement annuel complet.
    *   Fiche de résultats détaillée.
*   **Design Premium** : Interface épurée, responsive et moderne (Polices Inter, ombres portées douces, micro-animations).

## 🛠 Technologies
*   **React (v19)** : Hooks avancés pour une réactivité optimale.
*   **Vite** : Performance de développement et build ultra-rapide.
*   **Vanilla CSS** : Design système complet avec variables CSS pour une maintenance facile.

## 🚀 Installation et Lancement

1.  **Installation** :
    ```bash
    npm install
    ```
2.  **Lancement** :
    ```bash
    npm run dev
    ```
3.  **Construction (Production)** :
    ```bash
    npm run build
    ```

## ⚠️ Avertissement Légal
Ce simulateur est un outil de démonstration. Les calculs sont donnés à titre indicatif et n'ont aucune valeur contractuelle.
