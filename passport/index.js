const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const {User} = require('../models');

module.exports = (passport) => {
    // serializeUser는 req.session 객체에 어떤 데이터를 저장할지 선택한다.
    // 매개변수로 user를 받아 done 함수에 두번째 인자로 user.id를 넘긴다.
    // done 함수의 첫번째 인자는 에러 발생 시 사용하는 것으로 두번째 인자가 중요한다.
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // deserializeUser는 매 요청시 실행된다.
    // app.js의 passport.session() 미들웨어가 이 메소드를 호출한다.
    // 세션에 저장했던 아이디를 받아(첫번째 인자) 데이터 베이스에서 사용자 정보를 조회한다.
    // 조회한 정보를 req.user에 저장한다.
    passport.deserializeUser((id, done) => {
        User.find({
            where : {id},
            // include에서 attributes를 지정하여 실수로 비밀번호를 조회하는것을 방지한다.
            include : [{
                model : User,
                attributes : ['id', 'nick'],
                as : 'Followers',
            }, {
                model : User,
                attributes : ['id', 'nick'],
                as : 'Followings',
            }],
        }).then(user => done(null, user))
          .catch(err => done(err));
    });

    local(passport);
    kakao(passport);
};