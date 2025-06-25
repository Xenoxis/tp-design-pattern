import classes from "./classes.js";


const explosionConfig = new classes.ExplosionBuilder()
    .withColor('0x0c')
    .withCount(12)
    .withPosition({x: 8, y: 12})
    .withDecorator(classes.GlowParticule, classes.ShadowParticule)
    .build();

const explosion = new classes.ProxyExplosionFactory().create(explosionConfig);
const explosion2 = new classes.ProxyExplosionFactory().create(explosionConfig);

console.log(explosion);