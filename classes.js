const PARTICULES_FLYWEIGHTS = {
    textures: Array.from({ length: 10 }, () =>
                Uint8Array.from({ length: 1024 }, () => Math.floor(Math.random() * 256))
            ),
    shaders: Array.from({length: 5}, (_, i) => `shader-${i}`)
}

class IParticules {

    clone() {
        throw new Error('Not Implemented');
    }

    render() {
        throw new Error('Not Implemented');
    }
}


class ParticulePrototype extends IParticules {
    constructor({size = 1, color = '0x0c', speed = {x: 0, y: 0}, position = {x: 0, y: 0}, lifeTime = 1} = {}) {
        super();

        this.size = size;
        this.color = color;
        this.speed = speed;
        this.position = position;
        this.lifeTime = lifeTime;

        return this;
    }

    clone() {
        return new ParticulePrototype({
            size: this.size,
            color: this.color,
            speed: {...this.speed},
            position: {...this.position},
            lifeTime: this.lifeTime
        });
    }
}


class Particule extends ParticulePrototype {
    constructor(properties) {
        const { size, color, speed, position, flyweight, lifeTime, ...rest } = properties;
        super();
        this.size = size;
        this.color = color;
        this.speed = speed;
        this.position = position;
        this.flyweight = flyweight;
        this.lifeTime = lifeTime;
    }

    render() {
        return new Promise((resolve) => {
            const renderInterval = setInterval(() => {
                if (this.lifeTime <= 0) {
                    clearInterval(renderInterval);
                    resolve();
                    return;
                }

                this.position = {
                    x: this.position.x + this.speed.x,
                    y: this.position.y + this.speed.y
                }

                this.lifeTime--;

                console.log({
                    size: this.size,
                    color: this.color,
                    speed: this.speed,
                    position: this.position,
                    flyweight: this.flyweight,
                    lifeTime: this.lifeTime
                });
            }, 1000);
        })
    }
}

class ParticulePrototypeFactory {
    static #reference

    constructor() {
        if (ParticulePrototypeFactory.#reference instanceof ParticulePrototypeFactory) return ParticulePrototypeFactory.#reference;

        ParticulePrototypeFactory.#reference = this
        
        this.item = new Map();

        return this;
    }

    build(color) {
        if (!color) return null;
        
        if (!this.item.has(color)) {
            this.item.set(color, new ParticulePrototype({color: color}))
        }

        return this.item.get(color);
    }

}

class ExplosionConfig {
    #pos
    #color
    #count
    #speed
    #lifeTime

    constructor({pos, color, count, speed, lifeTime}) {
        this.#pos = pos;
        this.#color = color;
        this.#count = count;
        this.#speed = speed;
        this.#lifeTime = lifeTime;
    }

    get() {
        return {
            pos: this.#pos,
            color: this.#color,
            count: this.#count,
            speed: this.#speed,
            lifeTime: this.#lifeTime
        }
    }
}

class ParticuleFlyweight {
    constructor(texturePos, shaderPos) {
        this.texture = PARTICULES_FLYWEIGHTS.textures[texturePos];
        this.shader = PARTICULES_FLYWEIGHTS.shaders[shaderPos];
        return this;
    }
}

class FlyweightFactory {
    static #reference;

    constructor() {
        if (FlyweightFactory.#reference instanceof FlyweightFactory) return FlyweightFactory.#reference;

        FlyweightFactory.#reference = this;
        this.items = new Map();

        return this;
    }

    get(texturePos, shaderPos) {
        if (texturePos >= PARTICULES_FLYWEIGHTS.textures.length || shaderPos >= PARTICULES_FLYWEIGHTS.shaders.length) return null;

        const key = `${texturePos}-${shaderPos}`;

        if (!this.items.has(key)) {
            this.items.set(key, new ParticuleFlyweight(texturePos, shaderPos));
        }

        return this.items.get(key);
    }

    count() {
        return this.items.size;
    }
}



class ExplosionBuilder {
    #defaults = {
        pos: { x: 0, y: 0 },
        color: '0x0c',
        count: 1,
        speed: { x: 0, y: 0 },
        lifeTime: 10,
        decorators: []
    }

    withPosition(x = 0, y = 0) {
        this.#defaults.pos = { x, y };
        return this;
    }

    withColor(color = '0x0c') {
        this.#defaults.color = color;
        return this;
    }

    withCount(count = 1) {
        this.#defaults.count = count;
        return this;
    }

    withDecorator(...decorators) {
        this.#defaults.decorators = decorators;
        return this;
    }

    withSpeed(x = 0, y = 0) {
        this.#defaults.speed = { x, y };
        return this;
    }

    build() {
        const { pos, color, count, speed, lifeTime } = this.#defaults;

        return new ExplosionConfig({
            pos,
            color,
            count,
            speed,
            lifeTime
        });
    }
}

class Explosion {
    constructor(particulesList) {
        this.particules = particulesList;

        return this;
    }

    start() {
        Promise.all(this.particules.map((particule) => particule.render()))
    }
}

class ExplosionFactory {
    static #reference

    constructor() {
        if (ExplosionFactory.#reference instanceof ExplosionFactory) return ExplosionFactory.#reference;
        ExplosionFactory.#reference = this;
        this.flyweightFactory = new FlyweightFactory(null, null);
        return this;
    }

    create(config) {
        if (!(config instanceof ExplosionConfig)) throw new Error('Wrong type');
        const explosionProperties = config.get();
        const particles = [];
        const flyweight = this.flyweightFactory.get(0, 0);
        const particuleProperties = new ParticulePrototypeFactory().build(config.get().color);

        particuleProperties.flyweight = flyweight;
        particuleProperties.lifeTime = explosionProperties.lifeTime;
        particuleProperties.position = explosionProperties.pos;
        particuleProperties.speed = explosionProperties.speed;

        for (let i = 0; i < explosionProperties.count; i++) {
            particles.push(new Particule(particuleProperties));
        }

        return new Explosion(particles);
    }
}

class ProxyExplosionFactory extends ExplosionFactory {
    cache = new Array(20).fill(null);

    create(config) {

        var configToUse, found = false;

        for(const savedConfig of this.cache) {
            if (!savedConfig) continue;

            if (JSON.stringify(config) == JSON.stringify(savedConfig)) {
                configToUse = savedConfig;
                found = true;
            }
        }

        if (!found) {
            configToUse = config;
            this.cache.shift();
            this.cache.push(config);
        }

        return super.create(configToUse);
    }   
}

class ParticuleDecorator extends IParticules {
    constructor(particule) {
       this.particule = particule;

       return this;
    }

    render() {
        return this.particule.render();
    }
}

class GlowParticule extends ParticuleDecorator {
    render() {
        console.log("Glowing Particule");

        return super.render();
    }
}

class ShadowParticule extends ParticuleDecorator {
    render() {
        console.log("Particule with shadows");

        return super.render();
    }
}

module.exports = {
    FlyweightFactory,
    ExplosionBuilder,
    ExplosionConfig,
    ExplosionFactory,
    ProxyExplosionFactory,
    GlowParticule,
    ShadowParticule
}