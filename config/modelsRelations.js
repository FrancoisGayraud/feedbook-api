let models = require('../models');

models.Favorites.belongsTo(models.Books, {foreignKey: 'book_id', as : 'book'});