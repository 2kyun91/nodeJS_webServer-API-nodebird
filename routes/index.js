// uuid는 범용 고유 식별자로 고유한 문자열을 만들고 싶을 때 사용한다.
// 완벽하게 고유하진 않지만 실제 사용 시 중복될 가능성은 거의 없다.
const express = require('express');
const uuidv4 = require('uuid/v4');
const {User, Domain} = require('../models');

const router = express.Router();

// 루트 라우터
router.get('/', (req, res, next) => {
    User.find({
        where : {id : req.user && req.user.id},
        include : {model : Domain},
    }).then((user) => {
        res.render('login', {
            user,
            loginError : req.flash('loginError'),
            domains : user && user.domains,
        });
    }).catch((error) => {
        next(error);
    });
});

// 도메인 등록 라우터
router.post('/domain', (req, res, next) => {
    Domain.create({
        userId : req.user.id,
        host : req.body.host,
        type : req.body.type,
        clientSecret : uuidv4(),
    }).then(() => {
        res.redirect('/');
    }).catch((error) => {
        next(error);
    });
});

module.exports = router;
