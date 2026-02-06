create database cinemahub;

CREATE TABLE movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    trailer_url VARCHAR(500),
    poster_url VARCHAR(500),
    banner_url VARCHAR(500),
    rating DECIMAL(3 , 1 ) DEFAULT 0,
    duration INT NOT NULL,
    age_rating ENUM('K', 'T13', 'T16', 'T18') DEFAULT 'K',
    release_date DATE NOT NULL,
    is_showing TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE theaters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE showtimes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    theater_id INT NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    price INT NOT NULL,
    total_seats INT NOT NULL DEFAULT 100,
    available_seats INT NOT NULL DEFAULT 100,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id)
        REFERENCES movies (id),
    FOREIGN KEY (theater_id)
        REFERENCES theaters (id)
);