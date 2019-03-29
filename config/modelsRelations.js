let models = require('../models');

models.Favorites.belongsTo(models.Books, {foreignKey: 'book_id', as : 'book'});

models.Comments.belongsTo(models.Users, {foreignKey: 'user_id', as: 'user'});
models.Comments.belongsTo(models.Books, {foreignKey: 'book_id', as: 'book'});
