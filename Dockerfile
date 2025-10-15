FROM php:8.2-apache
RUN apt-get update \
 && apt-get install -y unzip libzip-dev libpng-dev libonig-dev git curl \
 && docker-php-ext-install pdo_mysql zip
RUN a2enmod rewrite
WORKDIR /var/www/html
COPY ./TheThao_BE/ /var/www/html
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
RUN chown -R www-data:www-data storage bootstrap/cache
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf /etc/apache2/apache2.conf
EXPOSE 80
CMD ["apache2-foreground"]
