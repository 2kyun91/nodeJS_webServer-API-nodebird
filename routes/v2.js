const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const {verifyToken, apiLimiter} = require('./middlewares');
const {Domain, User, Post, Hashtag} = require('../models');

const router = express.Router();

// v2 라우터에 속한 모든 라우터에 cors 미들웨어가 적용된다.
router.use(async (req, res, next) => {
    // 도메인 모델로 클라이언트의 도메인(req.get('origin'))과 호스트(칼럼)가 일치하는 것이 있는지 검사한다.
    // http나 https 같은 프로토콜을 떼어낼 때는 url.parse 메소드를 사용한다.
    const domain = await Domain.find({
        where : {host : url.parse(req.get('origin')).host},
    });
    
    // 일치하는 것이 있다면 cors를 허용해서 다음 미들웨어로 보낸다.
    // cors 미들웨어에 옵션 origin 속성에 허용할 도메인만 따로 적어준다.
    // 라우터 미들웨어 안에 cors 미들웨어가 들어있다.
    // 미들웨어에 사용자 정의 기능을 추가하고 싶을 때 보통 이렇게 하며 이럴 때는 내부 미들웨어에 (req, res, next)를 인자로 제공해서 호출한다.
    if (domain) {
        cors({origin : req.get('origin')})(req, res, next);
    } else {
        next();
    }
});

router.post('/token', apiLimiter, async (req, res) => {
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
                 message : '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요.',
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
             expiresIn : '30m', // 30분
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
             message : '서버에러',
         });
     }
});

router.get('/test', verifyToken, apiLimiter, (req, res) => {
     res.json(req.decoded);
});

router.get('/posts/my', apiLimiter, verifyToken, (req, res) => {
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
             message : '서버에러',
         });
     });
});

router.get('/posts/hashtag/:title', verifyToken, apiLimiter, async (req, res) => {
     try {
         const hashtag = await Hashtag.find({title : req.params.title});
         
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
             message : '서버 에러',
         });
     }
});

 module.exports = router;