const PARTICULES_FLYWEIGHTS = {
    textures: new Array(10).fill(new Uint8Array(1024).fill(Math.random() * 256)),
    shaders: new Array.from({length: 5}, (_, i) => `shader-${i}`)
}

class ParticulePrototype {
    constructor({size = 1, color = '0x0c', speed = {x: 0, y: 0}}) {
        this.size = size;
        this.color = color;
        this.speed = speed;

        return this;
    }

    clone() {
        return new ParticulePrototype(this.size, this.color, {...this.speed});
    }
}


class Particule extends ParticulePrototype {
    constructor(properties) {
        const { size, color, speed, position, flyweight, lifeTime, ...rest } = properties;

        this.size = size;
        this.color = color;
        this.speed = speed;
        this.position = position;
        this.flyweight = flyweight;
    }

    render() {
        const data = {
            size: this.size,
            baseColor: this.baseColor,
            speed: this.speed,
            position: this.position,
            flyweight: this.flyweight
        }

        console.log(JSON.stringify(data));
    }
}

class ExplosionConfig {
    #pos
    #color
    #count
    #spread
    #lifeTime

    constructor(pos, color, count, spread, lifeTime) {
        this.#pos = pos;
        this.#color = color;
        this.#count = count;
        this.#spread = spread;
        this.#lifeTime = lifeTime;
    }

    get() {
        return {
            pos: this.#pos,
            color: this.#color,
            count: this.#count,
            spread: this.#spread,
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
        spread: 4,
        lifeTime: 10
    }

    withPosition(x = 0, y = 0) {
        this.#defaults.pos = {x, y};
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

    withSpread(spread = 4) {
        this.#defaults.spread = spread
        return this;
    }

    build() {
        const { pos, color, count, spread, lifeTime } = this.#defaults;
        return new ExplosionConfig(pos, color, count, spread, lifeTime);
    }
}

class Explosion {
    constructor(particulesList) {
        this.particules = particulesList;

        return this;
    }
}

class ExplosionFactory {
    static #reference

    constructor() {
        if (ExplosionFactory.#reference instanceof ExplosionFactory) return ExplosionFactory.#reference;
        ExplosionFactory.#reference = this;
        this.prototype = new ParticulePrototype();
        this.flyweightFactory = new FlyweightFactory(null, null);
        return this;
    }

    create(config) {
        if (!(config instanceof ExplosionConfig)) throw new Error('Wrong type');
        const explosionProperties = config.get();
        const particles = [];
        const flyweight = this.flyweightFactory.get(0, 0);

        for (let i = 0; i < explosionProperties.count; i++) {
            const particuleProperties = this.prototype.clone();

            particuleProperties.speed = {
                x: (Math.random() * explosionProperties.spread) * particuleProperties.speed.x,
                y: (Math.random() * explosionProperties.spread) * particuleProperties.speed.y
            }

            particuleProperties.flyweight = flyweight;
            particuleProperties.lifeTime = explosionProperties.lifeTime;
            particuleProperties.position = explosionProperties.pos;

            const particle = new Particule(particuleProperties);
            particles.push(particle);
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

class ParticuleDecorator {
    constructor(particule) {
       this.particule = particule;

       return this;
    }

    child() {
        return this.particule;
    }
}

class GlowParticule extends ParticuleDecorator {
    constructor(particule) {
        console.log("Making Particules Glow");

        this.particule = particule;

        return this.child();
    }
}

class ShadowParticule extends ParticuleDecorator {
    constructor(particule) {
        console.log("Make Shadow around particules");

        this.particule = particule;

        return this.child();
    }
}