const express = require('express');
const jwt = require('jsonwebtoken');

// express.Router() 선언하기 전에 deprecated 미들웨어를 추가하여 v1으로 접근한 모든 요청에 deprecated 응답을 보내도록 한다.
const {verifyToken, deprecated} = require('./middlewares');
const {Domain, User, Post, Hashtag} = require('../models');

const router = express.Router();

// v2 라우터로 버전이 업그레이드 되었으므로 기존 v1 라우터를 사용할 시에는 경고 메세지를 띄워준다.
router.use(deprecated);

router.post('/token', async (req, res) => {
    const {clientSecret} = req.body;
    try {
        const domain = await Domain.find({
            where : {clientSecret},
            include : {
                model : User,
                attribute : ['nick', 'id'],
            },
        });
        
        if (!domain) {
            return res.status(401).json({
                code : 401,
                message : '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
            });
        }
        
        /**
         * sign() 메소드의 인자
         * - 첫번째 인자 : 토큰의 내용
         * - 두번째 인자 : 토큰의 비밀키
         * - 세번째 인자 : 토큰의 설정(유효기간,발급자)
         */
        const token = jwt.sign({
            id : domain.user.id,
            nick : domain.user.nick,
        }, process.env.JWT_SECRET, {
            expiresIn : '1m', // 1분
            issuer : 'nodebird',
        });

        return res.json({
            code : 200,
            message : '토큰이 발급되었습니다.',
            token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code : 500,
            message : '서버 에러',
        });
    }
});

router.get('/test', verifyToken, (req, res) => {
    res.json(req.decoded);
});

router.get('/posts/my', verifyToken, (req, res) => {
    Post.findAll({where : {userId : req.decoded.id}}).then((posts) => {
        console.log(posts);
        res.json({
            code : 200,
            payload : posts,
        });
    }).catch((error) => {
        console.error(error);
        return res.status(500).json({
            code : 500,
            message : '서버 에러',
        });
    });
});

router.get('/posts/hashtag/:title', verifyToken, async (req, res) => {
    try {
        const hashtag = await Hashtag.find({where : {title : req.params.title}});
        if (!hashtag) {
            return res.status(404).json({
                code : 404,
                message : '검색 결과가 없습니다.',
            });
        }

        const posts = await hashtag.getPosts();
        return res.json({
            code : 200,
            payload : posts,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code : 500, 
            message : '서버에러',
        });
    }
});

module.exports = router;