# PHP 8.2 + Apache
FROM php:8.2-apache

# Cài extension cần thiết cho Laravel
RUN apt-get update \
 && apt-get install -y unzip libzip-dev libpng-dev libonig-dev git curl \
 && docker-php-ext-install pdo_mysql zip

# Bật mod_rewrite để Laravel route hoạt động
RUN a2enmod rewrite

# Đặt thư mục làm việc
WORKDIR /var/www/html

# Copy toàn bộ source vào container
COPY . /var/www/html

# Cài Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Cài đặt các package Laravel (không include dev)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Cấp quyền cho storage và cache
RUN chown -R www-data:www-data storage bootstrap/cache

# Cấu hình Apache để trỏ vào thư mục public
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf /etc/apache2/apache2.conf

# Mở port 80 cho web server
EXPOSE 80

# Chạy Apache khi container start
CMD ["apache2-foreground"]
