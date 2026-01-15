# Configuration Backend

## Variables d'environnement (.env)

Le fichier `backend/.env` contient les paramètres de connexion MySQL:

```
DB_HOST=localhost          # Adresse du serveur MySQL
DB_USER=root              # Utilisateur MySQL
DB_PASSWORD=              # Mot de passe MySQL (vide par défaut)
DB_NAME=form_app_db       # Nom de la base de données
PORT=5000                 # Port du serveur
```

### Configuration de MySQL

Avant de démarrer, assurez-vous que:

1. **MySQL Server est en cours d'exécution**
   - Windows: Services → MySQL80
   - Mac: System Preferences → MySQL
   - Linux: `sudo systemctl start mysql`

2. **Créez la base de données**
   ```sql
   CREATE DATABASE form_app_db;
   ```

3. **Mettez à jour .env si nécessaire**
   - Si vous avez un mot de passe MySQL, ajoutez-le
   - Si MySQL n'est pas sur localhost, mettez à jour DB_HOST

### Troubleshooting

#### Erreur: "connect ECONNREFUSED 127.0.0.1:3306"
- MySQL n'est pas en cours d'exécution
- Solution: Démarrez le service MySQL

#### Erreur: "ER_ACCESS_DENIED_FOR_USER"
- Les identifiants MySQL sont incorrects
- Solution: Vérifiez DB_USER et DB_PASSWORD

#### Erreur: "ER_BAD_DB_ERROR"
- La base de données n'existe pas
- Solution: Créez la base avec `CREATE DATABASE form_app_db;`
