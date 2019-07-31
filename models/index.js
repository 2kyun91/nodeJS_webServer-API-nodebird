const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./user')(sequelize, Sequelize);
db.Post = require('./post')(sequelize, Sequelize);
db.Hashtag = require('./hashtag')(sequelize, Sequelize);
db.Domain = require('./domain')(sequelize, Sequelize);

// User모델과 Post모델은 1:N 관계에 있으므로 hasMany와 belongsTo로 연결되어 있다.
// 시퀄라이즈는 Post 모델에 userId 칼럼을 추가한다.
db.User.hasMany(db.Post);
db.Post.belongsTo(db.User);

// Post와 Hashtag모델은 N:M(다대다) 관계이다. belongToMany 메소드로 정의한다.
// N:M 관계에서는 중간에 관계 테이블이 생성된다.
// 시퀄라이즈가 관계를 분석하여 PostHashtag라는 이름으로 테이블을 자동 생성한다.
// 칼럼명은 postId와 hashTagId이다.
// 시퀄라이즈는 
// post 데이터에는 getHashtags, addHashtags등의 메소드를 추가하고
// hashtag 데이터에는 getPosts, addPosts등의 메소드를 추가한다.
db.Post.belongsToMany(db.Hashtag, {through : 'PostHashtag'});
db.Hashtag.belongsToMany(db.Post, {through : 'PostHashtag'});

// 같은 테이블끼리도 N:M관계를 가질 수 있다.
// 팔로잉 기능도 N:M 관계로 사용자 한명이 팔로워를 여러 명 가질수도 있고 여러 명을 팔로잉할 수도 있다.
// 같은 테이블 간 N:M 관계에서는 모델 이름과 칼럼 이름을 따로 정해줘야 한다.
// 모델 이름은 through 옵션으로 정하고 칼럼 이름은 foreignkey 옵션으로 정한다.
// as 옵션은 시퀄라이즈가 JOIN 작업 시 사용하는 이름이다.
db.User.belongsToMany(db.User, {
  foreignKey : 'followingId',
  as : 'Followers',
  through : 'Follow',
});

db.User.belongsToMany(db.User, {
  foreignKey : 'followerId',
  as : 'Followings',
  through : 'Follow',
});

// 사용자 모델과 N:M 관계, 사용자 한명이 여러 도메인을 소유할 수 있다.
db.User.hasMany(db.Domain);
db.Domain.belongsTo(db.User);

module.exports = db;