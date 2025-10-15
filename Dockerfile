# PHP 8.2 + Apache
FROM php:8.2-apache

# Cài extension cần thiết cho Laravel
RUN apt-get update \
 && apt-get install -y unzip libzip-dev libpng-dev libonig-dev git curl \
 && docker-php-ext-install pdo_mysql zip

# Bật mod_rewrite cho Laravel route
RUN a2enmod rewrite

# Làm việc trong thư mục app
WORKDIR /var/www/html

# >>> CHỈ copy mã nguồn backend vào container (thư mục TheThao_BE)
#    để có composer.json nằm đúng chỗ
COPY ./TheThao_BE/ /var/www/html

# Cài Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Cho phép composer chạy dưới quyền root (tránh warning)
ENV COMPOSER_ALLOW_SUPERUSER=1

# Cài dependencies Laravel
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Quyền cho storage & cache
RUN chown -R www-data:www-data storage bootstrap/cache

# DocumentRoot trỏ vào public/
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' \
    /etc/apache2/sites-available/000-default.conf /etc/apache2/apache2.conf

EXPOSE 80
CMD ["apache2-foreground"]
