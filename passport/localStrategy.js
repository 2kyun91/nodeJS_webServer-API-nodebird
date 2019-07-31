const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const {User} = require('../models');

/**
 * LocalStrategy의 첫 번쨰 인자로 주어진 객체는 전략에 관한 설정을 하는 곳이다.
 * usernameField, passwordField에 일치하는 req.body의 속성명을 적어주면 된다.
 * req.body.email에 이메일이 req.body.password에 비밀번호가 담겨있다.
 * 
 * 두번째 인자인 async 함수가 실제 전략을 수행한다.
 * 위에서 넣어준 email과 password는 async 함수의 첫번째와 두번째 매개변수가 된다.
 * 
 * 세번째 인자인 done 함수는 passport.authenticate의 콜백 함수이다.
 */
module.exports = (passport) => {
    passport.use(new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
    }, async (email, password, done) => {
        try {
            const exUser = await User.find({ where : { email } });
            if (exUser) {
                const result = await bcrypt.compare(password, exUser.password);
                if (result) {
                    done(null, exUser);
                } else {
                    done(null, false, {message : '비밀번호가 일치하지 않습니다.'});
                }
            } else {
                done(null, false, {message : '가입되지 않은 회원입니다.'});
            }
        } catch (error) {
            console.error(error);
            done(error);
        }
    }));
};