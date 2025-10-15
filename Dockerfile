# PHP 8.2 + Apache
FROM php:8.2-apache

# Cài extension cần cho Laravel
RUN apt-get update \
 && apt-get install -y unzip libzip-dev libpng-dev git curl \
 && docker-php-ext-install pdo_mysql zip

# Bật mod_rewrite để Laravel route chạy
RUN a2enmod rewrite

# Thư mục làm việc của app trong container
WORKDIR /var/www/html

# --- QUAN TRỌNG: chỉ copy phần backend vào container ---
# Copy file composer trước để tận dụng cache
COPY TheThao_BE/composer.json TheThao_BE/composer.lock* ./

# Cài Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
ENV COMPOSER_ALLOW_SUPERUSER=1

# Cài vendor trước (chưa cần copy toàn bộ code)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Giờ mới copy toàn bộ mã nguồn backend vào
COPY TheThao_BE/ ./

# Cấp quyền cho storage & cache
RUN chown -R www-data:www-data storage bootstrap/cache

# Trỏ DocumentRoot vào public/
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' \
    /etc/apache2/sites-available/000-default.conf /etc/apache2/apache2.conf

EXPOSE 80
CMD ["apache2-foreground"]
