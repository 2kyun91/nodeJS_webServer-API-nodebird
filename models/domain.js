module.exports = (sequelize, DataTypes) => (
    sequelize.define('domain', {
        host : {
            type : DataTypes.STRING(80),
            allowNull : false,
        },
        type : {
            type : DataTypes.STRING(10),
            allowNull : false,
        },
        clientSecret : { // API를 사용할 때 필요한 비밀키.
            type : DataTypes.STRING(40),
            allowNull : false,
        },
    }, {
        validate : { // 데이터를 추가로 검증하는 속성
            unknownType() { // 검증기
                console.log(this.type, this.type !== 'free', this.type !== 'premium');
                if (this.type !== 'free' && this.type !== 'premium') {
                    throw new Error('type 컬럼은 free나 premium이어야 합니다.');
                }
            },
        },
        timestamps : true,
        paranoid : true,
    })
);