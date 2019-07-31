const jwt = require('jsonwebtoken');
const RateLimit = require('express-rate-limit');

// Passport는 req 객체에 isAuthenticated 메소드를 추가한다.
// 로그인 중이면 req.isAuthenticated()가 true 아니면 false이다.
exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(403).send('로그인 필요');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next()
    } else {
        res.redirect('/');
    }
};

exports.verifyToken = (req, res, next) => {
    try {
        // 요청 헤더에 저장된 토큰을 사용한다. 사용자가 쿠키처럼 헤더에 토큰을 넣어 보낼 것이다.
        // jwt.verify 메소드로 토큰을 검증할 수 있는데 첫번째 인자로 토큰을 두번째 인자로 토큰의 비밀키를 넣어준다.
        // req.decoded에 대입하여 다음 미들웨어에서 쓸 수 있도록 한다.
        req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') { // 유효기간 초과
            return res.status(419).json({
                code : 419,
                message : '토큰이 만료되었습니다.',
            });
        }
        return res.status(401).json({
            code : 401,
            message : '유효하지 않은 토큰입니다.',
        });
    }
};

/**
 * apiLimiter 미들웨어 옵션
 * - windows : 기준 시간
 * - max : 허용 횟수
 * - delayMs : 호출 간격
 * - handler() : 제한 초과 시 콜백함수
 */
exports.apiLimiter = new RateLimit({
    windowMs : 60 * 1000, // 1분
    max : 1,
    delayMs : 0,
    handler(req, res) {
        res.status(this.statusCode).json({
            code : this.statusCode, // 기본값 429
            message : '1분에 한 번만 요청할 수 있습니다.',
        });
    },
});

exports.deprecated = (req, res) => {
    res.status(410).json({
        code : 410,
        message : '새로운 버전이 나왔습니다. 새로운 버전을 사용하세요.',
    });
};