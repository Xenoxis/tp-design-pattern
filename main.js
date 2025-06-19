import classes from "./classes.js";


const explosionConfig = new classes.ExplosionBuilder().withColor('0x0c').withCount(12).withPosition({x: 8, y: 12}).build();

const explosion = new classes.ExplosionFactory().create(explosionConfig);

console.log(explosion);