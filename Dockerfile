# Imagen oficial de PHP con Apache (ya incluye SQLite/PDO)
FROM php:8.3-apache

# Soporte para PostgreSQL (la base de datos de Render)
RUN apt-get update && apt-get install -y libpq-dev && docker-php-ext-install pdo_pgsql && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html
COPY . /var/www/html

# La carpeta database debe poder escribirse (aquí se guarda el .db)
RUN mkdir -p /var/www/html/database /var/data \
    && chown -R www-data:www-data /var/www/html/database /var/data

# Render indica el puerto con la variable PORT: Apache debe escucharlo
CMD ["sh", "-c", "sed -i \"s/80/${PORT:-10000}/g\" /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf && apache2-foreground"]
