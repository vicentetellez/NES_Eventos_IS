import prisma from '../src/config/prisma.js';
import argon2 from "argon2";
import { ARGON2_TYPE, ARGON2_MEMORY_COST, ARGON2_TIME_COST, ARGON2_PARALLELISM } from '../src/config/configEnv.js';

async function seedRegiones(){
    try {
        const countRegion = await prisma.region.count();
        if (countRegion === 0){
            const regiones = [
                { nombre: 'Región de Arica y Parinacota' },
                { nombre: 'Región de Tarapacá' },
                { nombre: 'Región de Antofagasta' },
                { nombre: 'Región de Atacama' },
                { nombre: 'Región de Coquimbo' },
                { nombre: 'Región de Valparaíso' },
                { nombre: 'Región del Libertador General Bernardo O\'Higgins' },
                { nombre: 'Región del Maule' },
                { nombre: 'Región de Ñuble' },
                { nombre: 'Región del Biobío' },
                { nombre: 'Región de la Araucanía' },
                { nombre: 'Región de los Ríos' },
                { nombre: 'Región de los Lagos' },
                { nombre: 'Región Aysén del General Carlos Ibáñez del Campo' },
                { nombre: 'Región de Magallanes y Antártica Chilena' },
                { nombre: 'Región Metropolitana de Santiago' }
            ];
            await prisma.region.createMany({ data: regiones });
            console.log('Regiones sembradas correctamente.');
        }
        else {
            console.log('Regiones ya existen en la base de datos.');
        }

    } catch (error) {
        console.error('Error al sembrar regiones:', error);
    }
}

async function seedComunas(){
    try {
        const countComuna = await prisma.comuna.count();
        if (countComuna === 0){
            const comunas = [
                // Región de Arica y Parinacota (ID: 1)
                { nombre: 'Arica', codigoRegion: 1 },
                { nombre: 'Camarones', codigoRegion: 1 },
                { nombre: 'Putre', codigoRegion: 1 },
                { nombre: 'General Lagos', codigoRegion: 1 },

                // Región de Tarapacá (ID: 2)
                { nombre: 'Alto Hospicio', codigoRegion: 2 },
                { nombre: 'Iquique', codigoRegion: 2 },
                { nombre: 'Huara', codigoRegion: 2 },
                { nombre: 'Camiña', codigoRegion: 2 },
                { nombre: 'Colchane', codigoRegion: 2 },
                { nombre: 'Pica', codigoRegion: 2 },
                { nombre: 'Pozo Almonte', codigoRegion: 2 },

                // Región de Antofagasta (ID: 3)
                { nombre: 'Tocopilla', codigoRegion: 3 },
                { nombre: 'María Elena', codigoRegion: 3 },
                { nombre: 'Calama', codigoRegion: 3 },
                { nombre: 'Ollagüe', codigoRegion: 3 },
                { nombre: 'San Pedro de Atacama', codigoRegion: 3 },
                { nombre: 'Antofagasta', codigoRegion: 3 },
                { nombre: 'Mejillones', codigoRegion: 3 },
                { nombre: 'Sierra Gorda', codigoRegion: 3 },
                { nombre: 'Taltal', codigoRegion: 3 },

                // Región de Atacama (ID: 4)
                { nombre: 'Chañaral', codigoRegion: 4 },
                { nombre: 'Diego de Almagro', codigoRegion: 4 },
                { nombre: 'Copiapó', codigoRegion: 4 },
                { nombre: 'Caldera', codigoRegion: 4 },
                { nombre: 'Tierra Amarilla', codigoRegion: 4 },
                { nombre: 'Vallenar', codigoRegion: 4 },
                { nombre: 'Freirina', codigoRegion: 4 },
                { nombre: 'Huasco', codigoRegion: 4 },
                { nombre: 'Alto del Carmen', codigoRegion: 4 },

                // Región de Coquimbo (ID: 5)
                { nombre: 'La Serena', codigoRegion: 5 },
                { nombre: 'La Higuera', codigoRegion: 5 },
                { nombre: 'Coquimbo', codigoRegion: 5 },
                { nombre: 'Andacollo', codigoRegion: 5 },
                { nombre: 'Vicuña', codigoRegion: 5 },
                { nombre: 'Paihuano', codigoRegion: 5 },
                { nombre: 'Ovalle', codigoRegion: 5 },
                { nombre: 'Río Hurtado', codigoRegion: 5 },
                { nombre: 'Monte Patria', codigoRegion: 5 },
                { nombre: 'Combarbalá', codigoRegion: 5 },
                { nombre: 'Punitaqui', codigoRegion: 5 },
                { nombre: 'Illapel', codigoRegion: 5 },
                { nombre: 'Salamanca', codigoRegion: 5 },
                { nombre: 'Los Vilos', codigoRegion: 5 },
                { nombre: 'Canela', codigoRegion: 5 },

                // Región de Valparaíso (ID: 6)
                { nombre: 'La Ligua', codigoRegion: 6 },
                { nombre: 'Petorca', codigoRegion: 6 },
                { nombre: 'Cabildo', codigoRegion: 6 },
                { nombre: 'Zapallar', codigoRegion: 6 },
                { nombre: 'Papudo', codigoRegion: 6 },
                { nombre: 'Los Andes', codigoRegion: 6 },
                { nombre: 'San Esteban', codigoRegion: 6 },
                { nombre: 'Calle Larga', codigoRegion: 6 },
                { nombre: 'Rinconada', codigoRegion: 6 },
                { nombre: 'San Felipe', codigoRegion: 6 },
                { nombre: 'Putaendo', codigoRegion: 6 },
                { nombre: 'Santa María', codigoRegion: 6 },
                { nombre: 'Panquehue', codigoRegion: 6 },
                { nombre: 'Llaillay', codigoRegion: 6 },
                { nombre: 'Catemu', codigoRegion: 6 },
                { nombre: 'Quillota', codigoRegion: 6 },
                { nombre: 'La Cruz', codigoRegion: 6 },
                { nombre: 'Calera', codigoRegion: 6 },
                { nombre: 'Nogales', codigoRegion: 6 },
                { nombre: 'Hijuelas', codigoRegion: 6 },
                { nombre: 'Limache', codigoRegion: 6 },
                { nombre: 'Olmué', codigoRegion: 6 },
                { nombre: 'Valparaíso', codigoRegion: 6 },
                { nombre: 'Viña del Mar', codigoRegion: 6 },
                { nombre: 'Quintero', codigoRegion: 6 },
                { nombre: 'Puchuncaví', codigoRegion: 6 },
                { nombre: 'Quilpué', codigoRegion: 6 },
                { nombre: 'Villa Alemana', codigoRegion: 6 },
                { nombre: 'Casablanca', codigoRegion: 6 },
                { nombre: 'Concón', codigoRegion: 6 },
                { nombre: 'Juan Fernández', codigoRegion: 6 },
                { nombre: 'San Antonio', codigoRegion: 6 },
                { nombre: 'Cartagena', codigoRegion: 6 },
                { nombre: 'El Tabo', codigoRegion: 6 },
                { nombre: 'El Quisco', codigoRegion: 6 },
                { nombre: 'Algarrobo', codigoRegion: 6 },
                { nombre: 'Santo Domingo', codigoRegion: 6 },
                { nombre: 'Isla de Pascua', codigoRegion: 6 },

                // Región del Libertador General Bernardo O'Higgins (ID: 7)
                { nombre: 'Rancagua', codigoRegion: 7 },
                { nombre: 'Graneros', codigoRegion: 7 },
                { nombre: 'Mostazal', codigoRegion: 7 },
                { nombre: 'Codegua', codigoRegion: 7 },
                { nombre: 'Machalí', codigoRegion: 7 },
                { nombre: 'Olivar', codigoRegion: 7 },
                { nombre: 'Requinoa', codigoRegion: 7 },
                { nombre: 'Rengo', codigoRegion: 7 },
                { nombre: 'Malloa', codigoRegion: 7 },
                { nombre: 'Quinta de Tilcoco', codigoRegion: 7 },
                { nombre: 'San Vicente', codigoRegion: 7 },
                { nombre: 'Pichidegua', codigoRegion: 7 },
                { nombre: 'Peumo', codigoRegion: 7 },
                { nombre: 'Coltauco', codigoRegion: 7 },
                { nombre: 'Coinco', codigoRegion: 7 },
                { nombre: 'Doñihue', codigoRegion: 7 },
                { nombre: 'Las Cabras', codigoRegion: 7 },
                { nombre: 'San Fernando', codigoRegion: 7 },
                { nombre: 'Chimbarongo', codigoRegion: 7 },
                { nombre: 'Placilla', codigoRegion: 7 },
                { nombre: 'Nancagua', codigoRegion: 7 },
                { nombre: 'Chépica', codigoRegion: 7 },
                { nombre: 'Santa Cruz', codigoRegion: 7 },
                { nombre: 'Lolol', codigoRegion: 7 },
                { nombre: 'Pumanque', codigoRegion: 7 },
                { nombre: 'Palmilla', codigoRegion: 7 },
                { nombre: 'Peralillo', codigoRegion: 7 },
                { nombre: 'Pichilemu', codigoRegion: 7 },
                { nombre: 'Navidad', codigoRegion: 7 },
                { nombre: 'Litueche', codigoRegion: 7 },
                { nombre: 'La Estrella', codigoRegion: 7 },
                { nombre: 'Marchihue', codigoRegion: 7 },
                { nombre: 'Paredones', codigoRegion: 7 },

                // Región del Maule (ID: 8)
                { nombre: 'Curicó', codigoRegion: 8 },
                { nombre: 'Teno', codigoRegion: 8 },
                { nombre: 'Romeral', codigoRegion: 8 },
                { nombre: 'Molina', codigoRegion: 8 },
                { nombre: 'Sagrada Familia', codigoRegion: 8 },
                { nombre: 'Hualañé', codigoRegion: 8 },
                { nombre: 'Licantén', codigoRegion: 8 },
                { nombre: 'Vichuquén', codigoRegion: 8 },
                { nombre: 'Rauco', codigoRegion: 8 },
                { nombre: 'Talca', codigoRegion: 8 },
                { nombre: 'Pelarco', codigoRegion: 8 },
                { nombre: 'Río Claro', codigoRegion: 8 },
                { nombre: 'San Clemente', codigoRegion: 8 },
                { nombre: 'Maule', codigoRegion: 8 },
                { nombre: 'San Rafael', codigoRegion: 8 },
                { nombre: 'Empedrado', codigoRegion: 8 },
                { nombre: 'Pencahue', codigoRegion: 8 },
                { nombre: 'Constitución', codigoRegion: 8 },
                { nombre: 'Curepto', codigoRegion: 8 },
                { nombre: 'Linares', codigoRegion: 8 },
                { nombre: 'Yerbas Buenas', codigoRegion: 8 },
                { nombre: 'Colbún', codigoRegion: 8 },
                { nombre: 'Longaví', codigoRegion: 8 },
                { nombre: 'Parral', codigoRegion: 8 },
                { nombre: 'Retiro', codigoRegion: 8 },
                { nombre: 'Villa Alegre', codigoRegion: 8 },
                { nombre: 'San Javier', codigoRegion: 8 },
                { nombre: 'Cauquenes', codigoRegion: 8 },
                { nombre: 'Pelluhue', codigoRegion: 8 },
                { nombre: 'Chanco', codigoRegion: 8 },

                // Región de Ñuble (ID: 9)
                { nombre: 'Bulnes', codigoRegion: 9 },
                { nombre: 'Chillán', codigoRegion: 9 },
                { nombre: 'Chillán Viejo', codigoRegion: 9 },
                { nombre: 'El Carmen', codigoRegion: 9 },
                { nombre: 'Pemuco', codigoRegion: 9 },
                { nombre: 'Pinto', codigoRegion: 9 },
                { nombre: 'Quillón', codigoRegion: 9 },
                { nombre: 'San Ignacio', codigoRegion: 9 },
                { nombre: 'Yungay', codigoRegion: 9 },
                { nombre: 'San Carlos', codigoRegion: 9 },
                { nombre: 'Coihueco', codigoRegion: 9 },
                { nombre: 'Ñiquén', codigoRegion: 9 },
                { nombre: 'San Fabián', codigoRegion: 9 },
                { nombre: 'San Nicolás', codigoRegion: 9 },
                { nombre: 'Quirihue', codigoRegion: 9 },
                { nombre: 'Cobquecura', codigoRegion: 9 },
                { nombre: 'Coelemu', codigoRegion: 9 },
                { nombre: 'Ninhue', codigoRegion: 9 },
                { nombre: 'Portezuelo', codigoRegion: 9 },
                { nombre: 'Ránquil', codigoRegion: 9 },
                { nombre: 'Trehuaco', codigoRegion: 9 },

                // Región del Biobío (ID: 10)
                { nombre: 'Alto Biobío', codigoRegion: 10 },
                { nombre: 'Los Angeles', codigoRegion: 10 },
                { nombre: 'Cabrero', codigoRegion: 10 },
                { nombre: 'Tucapel', codigoRegion: 10 },
                { nombre: 'Antuco', codigoRegion: 10 },
                { nombre: 'Quilleco', codigoRegion: 10 },
                { nombre: 'Santa Bárbara', codigoRegion: 10 },
                { nombre: 'Quilaco', codigoRegion: 10 },
                { nombre: 'Mulchén', codigoRegion: 10 },
                { nombre: 'Negrete', codigoRegion: 10 },
                { nombre: 'Nacimiento', codigoRegion: 10 },
                { nombre: 'Laja', codigoRegion: 10 },
                { nombre: 'San Rosendo', codigoRegion: 10 },
                { nombre: 'Yumbel', codigoRegion: 10 },
                { nombre: 'Concepción', codigoRegion: 10 },
                { nombre: 'Talcahuano', codigoRegion: 10 },
                { nombre: 'Penco', codigoRegion: 10 },
                { nombre: 'Tomé', codigoRegion: 10 },
                { nombre: 'Florida', codigoRegion: 10 },
                { nombre: 'Hualpén', codigoRegion: 10 },
                { nombre: 'Hualqui', codigoRegion: 10 },
                { nombre: 'Santa Juana', codigoRegion: 10 },
                { nombre: 'Lota', codigoRegion: 10 },
                { nombre: 'Coronel', codigoRegion: 10 },
                { nombre: 'San Pedro de la Paz', codigoRegion: 10 },
                { nombre: 'Chiguayante', codigoRegion: 10 },
                { nombre: 'Lebu', codigoRegion: 10 },
                { nombre: 'Arauco', codigoRegion: 10 },
                { nombre: 'Curanilahue', codigoRegion: 10 },
                { nombre: 'Los Alamos', codigoRegion: 10 },
                { nombre: 'Cañete', codigoRegion: 10 },
                { nombre: 'Contulmo', codigoRegion: 10 },
                { nombre: 'Tirua', codigoRegion: 10 },

                // Región de la Araucanía (ID: 11)
                { nombre: 'Angol', codigoRegion: 11 },
                { nombre: 'Renaico', codigoRegion: 11 },
                { nombre: 'Collipulli', codigoRegion: 11 },
                { nombre: 'Lonquimay', codigoRegion: 11 },
                { nombre: 'Curacautín', codigoRegion: 11 },
                { nombre: 'Ercilla', codigoRegion: 11 },
                { nombre: 'Victoria', codigoRegion: 11 },
                { nombre: 'Traiguén', codigoRegion: 11 },
                { nombre: 'Lumaco', codigoRegion: 11 },
                { nombre: 'Purén', codigoRegion: 11 },
                { nombre: 'Los Sauces', codigoRegion: 11 },
                { nombre: 'Temuco', codigoRegion: 11 },
                { nombre: 'Lautaro', codigoRegion: 11 },
                { nombre: 'Perquenco', codigoRegion: 11 },
                { nombre: 'Vilcún', codigoRegion: 11 },
                { nombre: 'Cholchol', codigoRegion: 11 },
                { nombre: 'Cunco', codigoRegion: 11 },
                { nombre: 'Melipeuco', codigoRegion: 11 },
                { nombre: 'Curarrehue', codigoRegion: 11 },
                { nombre: 'Pucón', codigoRegion: 11 },
                { nombre: 'Villarrica', codigoRegion: 11 },
                { nombre: 'Freire', codigoRegion: 11 },
                { nombre: 'Pitrufquén', codigoRegion: 11 },
                { nombre: 'Gorbea', codigoRegion: 11 },
                { nombre: 'Loncoche', codigoRegion: 11 },
                { nombre: 'Toltén', codigoRegion: 11 },
                { nombre: 'Teodoro Schmidt', codigoRegion: 11 },
                { nombre: 'Saavedra', codigoRegion: 11 },
                { nombre: 'Carahue', codigoRegion: 11 },
                { nombre: 'Nueva Imperial', codigoRegion: 11 },
                { nombre: 'Galvarino', codigoRegion: 11 },
                { nombre: 'Padre las Casas', codigoRegion: 11 },

                // Región de los Ríos (ID: 12)
                { nombre: 'Valdivia', codigoRegion: 12 },
                { nombre: 'Mariquina', codigoRegion: 12 },
                { nombre: 'Lanco', codigoRegion: 12 },
                { nombre: 'Máfil', codigoRegion: 12 },
                { nombre: 'Corral', codigoRegion: 12 },
                { nombre: 'Los Lagos', codigoRegion: 12 },
                { nombre: 'Panguipulli', codigoRegion: 12 },
                { nombre: 'Paillaco', codigoRegion: 12 },
                { nombre: 'La Unión', codigoRegion: 12 },
                { nombre: 'Futrono', codigoRegion: 12 },
                { nombre: 'Río Bueno', codigoRegion: 12 },
                { nombre: 'Lago Ranco', codigoRegion: 12 },

                // Región de los Lagos (ID: 13)
                { nombre: 'Osorno', codigoRegion: 13 },
                { nombre: 'San Pablo', codigoRegion: 13 },
                { nombre: 'Puyehue', codigoRegion: 13 },
                { nombre: 'Puerto Octay', codigoRegion: 13 },
                { nombre: 'Purranque', codigoRegion: 13 },
                { nombre: 'Río Negro', codigoRegion: 13 },
                { nombre: 'San Juan de la Costa', codigoRegion: 13 },
                { nombre: 'Puerto Montt', codigoRegion: 13 },
                { nombre: 'Puerto Varas', codigoRegion: 13 },
                { nombre: 'Cochamó', codigoRegion: 13 },
                { nombre: 'Calbuco', codigoRegion: 13 },
                { nombre: 'Maullín', codigoRegion: 13 },
                { nombre: 'Los Muermos', codigoRegion: 13 },
                { nombre: 'Fresia', codigoRegion: 13 },
                { nombre: 'Llanquihue', codigoRegion: 13 },
                { nombre: 'Frutillar', codigoRegion: 13 },
                { nombre: 'Castro', codigoRegion: 13 },
                { nombre: 'Ancud', codigoRegion: 13 },
                { nombre: 'Quemchi', codigoRegion: 13 },
                { nombre: 'Dalcahue', codigoRegion: 13 },
                { nombre: 'Curaco de Vélez', codigoRegion: 13 },
                { nombre: 'Quinchao', codigoRegion: 13 },
                { nombre: 'Puqueldón', codigoRegion: 13 },
                { nombre: 'Chonchi', codigoRegion: 13 },
                { nombre: 'Queilén', codigoRegion: 13 },
                { nombre: 'Quellón', codigoRegion: 13 },
                { nombre: 'Chaitén', codigoRegion: 13 },
                { nombre: 'Hualaihué', codigoRegion: 13 },
                { nombre: 'Futaleufú', codigoRegion: 13 },
                { nombre: 'Palena', codigoRegion: 13 },

                // Región Aysén del General Carlos Ibáñez del Campo (ID: 14)
                { nombre: 'Coyhaique', codigoRegion: 14 },
                { nombre: 'Lago Verde', codigoRegion: 14 },
                { nombre: 'Aysén', codigoRegion: 14 },
                { nombre: 'Cisnes', codigoRegion: 14 },
                { nombre: 'Guaitecas', codigoRegion: 14 },
                { nombre: 'Chile Chico', codigoRegion: 14 },
                { nombre: 'Río Ibánez', codigoRegion: 14 },
                { nombre: 'Cochrane', codigoRegion: 14 },
                { nombre: 'O\'Higgins', codigoRegion: 14 },
                { nombre: 'Tortel', codigoRegion: 14 },

                // Región de Magallanes y Antártica Chilena (ID: 15)
                { nombre: 'Natales', codigoRegion: 15 },
                { nombre: 'Torres del Paine', codigoRegion: 15 },
                { nombre: 'Punta Arenas', codigoRegion: 15 },
                { nombre: 'Río Verde', codigoRegion: 15 },
                { nombre: 'Laguna Blanca', codigoRegion: 15 },
                { nombre: 'San Gregorio', codigoRegion: 15 },
                { nombre: 'Porvenir', codigoRegion: 15 },
                { nombre: 'Primavera', codigoRegion: 15 },
                { nombre: 'Timaukel', codigoRegion: 15 },
                { nombre: 'Cabo de Hornos', codigoRegion: 15 },
                { nombre: 'Antártica', codigoRegion: 15 },

                // Región Metropolitana de Santiago (ID: 16)
                { nombre: 'Santiago', codigoRegion: 16 },
                { nombre: 'Independencia', codigoRegion: 16 },
                { nombre: 'Conchalí', codigoRegion: 16 },
                { nombre: 'Huechuraba', codigoRegion: 16 },
                { nombre: 'Recoleta', codigoRegion: 16 },
                { nombre: 'Providencia', codigoRegion: 16 },
                { nombre: 'Vitacura', codigoRegion: 16 },
                { nombre: 'Lo Barnechea', codigoRegion: 16 },
                { nombre: 'Las Condes', codigoRegion: 16 },
                { nombre: 'Ñuñoa', codigoRegion: 16 },
                { nombre: 'La Reina', codigoRegion: 16 },
                { nombre: 'Macul', codigoRegion: 16 },
                { nombre: 'Peñalolén', codigoRegion: 16 },
                { nombre: 'La Florida', codigoRegion: 16 },
                { nombre: 'San Joaquín', codigoRegion: 16 },
                { nombre: 'La Granja', codigoRegion: 16 },
                { nombre: 'La Pintana', codigoRegion: 16 },
                { nombre: 'San Ramón', codigoRegion: 16 },
                { nombre: 'San Miguel', codigoRegion: 16 },
                { nombre: 'La Cisterna', codigoRegion: 16 },
                { nombre: 'El Bosque', codigoRegion: 16 },
                { nombre: 'Pedro Aguirre Cerda', codigoRegion: 16 },
                { nombre: 'Lo Espejo', codigoRegion: 16 },
                { nombre: 'Estación Central', codigoRegion: 16 },
                { nombre: 'Cerrillos', codigoRegion: 16 },
                { nombre: 'Maipú', codigoRegion: 16 },
                { nombre: 'Quinta Normal', codigoRegion: 16 },
                { nombre: 'Lo Prado', codigoRegion: 16 },
                { nombre: 'Pudahuel', codigoRegion: 16 },
                { nombre: 'Cerro Navia', codigoRegion: 16 },
                { nombre: 'Renca', codigoRegion: 16 },
                { nombre: 'Quilicura', codigoRegion: 16 },
                { nombre: 'Colina', codigoRegion: 16 },
                { nombre: 'Lampa', codigoRegion: 16 },
                { nombre: 'Tiltil', codigoRegion: 16 },
                { nombre: 'Puente Alto', codigoRegion: 16 },
                { nombre: 'San José de Maipo', codigoRegion: 16 },
                { nombre: 'Pirque', codigoRegion: 16 },
                { nombre: 'San Bernardo', codigoRegion: 16 },
                { nombre: 'Buin', codigoRegion: 16 },
                { nombre: 'Paine', codigoRegion: 16 },
                { nombre: 'Calera de Tango', codigoRegion: 16 },
                { nombre: 'Melipilla', codigoRegion: 16 },
                { nombre: 'María Pinto', codigoRegion: 16 },
                { nombre: 'Curacaví', codigoRegion: 16 },
                { nombre: 'Alhué', codigoRegion: 16 },
                { nombre: 'San Pedro', codigoRegion: 16 },
                { nombre: 'Talagante', codigoRegion: 16 },
                { nombre: 'Peñaflor', codigoRegion: 16 },
                { nombre: 'Isla de Maipo', codigoRegion: 16 },
                { nombre: 'El Monte', codigoRegion: 16 },
                { nombre: 'Padre Hurtado', codigoRegion: 16 }
            ];
            await prisma.comuna.createMany({ data: comunas });
            console.log('Comunas sembradas correctamente.');
        }
        else {
            console.log('Comunas ya existen en la base de datos.');
        }
    } catch (error) {
        console.error('Error al sembrar comunas:', error);
    }
}

async function seedPersonas(){
    try {
        const  countPersona = await prisma.persona.count();
        if(countPersona === 0){
            const personas = [
                { rut: '11111111-1', nombre: 'ADMIN', primerApellido: 'ADMIN', segundoApellido: 'ADMIN', fechaNacimiento: new Date('2000-01-01'), telefono: '000000000', email: 'default.user@example.com', codigoComuna: 295 },
                { rut: '12345678-5', nombre: 'Juan', primerApellido: 'Pérez', segundoApellido: 'Gómez', fechaNacimiento: new Date('1990-01-01'), telefono: '123456789', email: 'juan.perez@example.com', codigoComuna: 181 },
                { rut: '98765432-5', nombre: 'María', primerApellido: 'López', segundoApellido: 'Martínez', fechaNacimiento: new Date('1992-02-02'), telefono: '987654321', email: 'maria.lopez@example.com', codigoComuna: 181 },
                { rut: '11223344-K', nombre: 'Pedro', primerApellido: 'García', segundoApellido: 'Fernández', fechaNacimiento: new Date('1985-03-03'), telefono: '112233445', email: 'pedro.garcia@example.com', codigoComuna: 181 },
                { rut: '55667788-3', nombre: 'Ana', primerApellido: 'Torres', segundoApellido: 'Vega', fechaNacimiento: new Date('1995-04-04'), telefono: '556677889', email: 'ana.torres@example.com', codigoComuna: 181 },
                { rut: '66778899-4', nombre: 'Luis', primerApellido: 'Ramírez', segundoApellido: 'Soto', fechaNacimiento: new Date('1988-05-05'), telefono: '667788990', email: 'luis.ramirez@example.com', codigoComuna: 181 },
                { rut: '77889900-0', nombre: 'Carla', primerApellido: 'Muñoz', segundoApellido: 'Rojas', fechaNacimiento: new Date('1993-06-06'), telefono: '778899001', email: 'carla.munoz@example.com', codigoComuna: 181 }            
            ];  
            await prisma.persona.createMany({ data: personas });
            console.log('Personas sembradas correctamente.');
        }
        else {
            console.log('Personas ya existen en la base de datos.');
        }
    } catch (error) {
        console.error('Error al sembrar personas:', error);
    }
}

async function seedClientes(){
    try {
        const countCliente = await prisma.cliente.count();
        if(countCliente === 0){
            const clientes = [
                { rut: '12345678-5'},
                { rut: '98765432-5'}

            ];
            await prisma.cliente.createMany({ data: clientes });
            console.log('Clientes sembrados correctamente.');
        }
        else {
            console.log('Clientes ya existen en la base de datos.');
        }
    } catch (error) {
        console.error('Error al sembrar clientes:', error);
    }
}

async function seedTrabajadores(){
    try {
        const countTrabajador = await prisma.trabajador.count();
        if(countTrabajador === 0){
            const trabajadores = [
                { rut: '11223344-K', esExterno: false, sueldo: 900000 },
                { rut: '55667788-3', esExterno: true }
            ];
            await prisma.trabajador.createMany({ data: trabajadores });
            console.log('Trabajadores sembrados correctamente.');
        }
        else {
            console.log('Trabajadores ya existen en la base de datos.');
        }
    } catch (error) {
        console.error('Error al sembrar trabajadores:', error);
    }
}

async function seedUsuarios(){
    try {
        const countUsuario = await prisma.usuario.count();
        if(countUsuario === 0){
            const usuarios = [
                { rut: '11111111-1', password: 'admin123', rol: 'ADMIN', ultimoAcceso: new Date(), debeCambiarPassword: false },
                { rut: '66778899-4', password: 'password123', rol: 'STAFF', ultimoAcceso: new Date(), debeCambiarPassword: false },
                { rut: '77889900-0', password: 'password123', rol: 'STAFF', ultimoAcceso: new Date(), debeCambiarPassword: true }
            ];
            for (const usuario of usuarios) {
                const passwordHash = await argon2.hash(usuario.password, {
                    type: ARGON2_TYPE,
                    memoryCost: parseInt(ARGON2_MEMORY_COST),
                    timeCost: parseInt(ARGON2_TIME_COST),
                    parallelism: parseInt(ARGON2_PARALLELISM),
                });
                usuario.password = passwordHash;
            }
            await prisma.usuario.createMany({ data: usuarios });
            console.log('Usuarios sembrados correctamente.');
        } 
        else {
            console.log('Usuarios ya existen en la base de datos.');
        }
    } catch (error) {
        console.error('Error al sembrar usuarios:', error);
    }
}

async function seedTipoEventos(){
    try {
        const countTipoEvento = await prisma.tipoEvento.count();
        if(countTipoEvento === 0){
            const tiposEvento = [
                { nombre: 'Arriendo de Escenarios y Mobiliario', descripcion: 'Usted puede alquilar equipamiento y mobiliario para sus eventos (No incluye producción del evento)', tarifaHoraBaseReferencial: 0 },
                { nombre: 'Seminarios', descripcion: 'Eventos educativos o formativos que reúnen a un grupo de personas para tratar un tema específico', tarifaHoraBaseReferencial: 30000 },
                { nombre: 'Congresos', descripcion: 'Reuniones formales de profesionales de un mismo sector para discutir temas de interés común', tarifaHoraBaseReferencial: 30000 },
                { nombre: 'Licenciaturas', descripcion: 'Ceremonias de graduación de estudiantes', tarifaHoraBaseReferencial: 35000 },
                { nombre: 'Ceremonias Academicas', descripcion: 'Eventos formales relacionados con instituciones educativas', tarifaHoraBaseReferencial: 35000 },
                { nombre: 'Shows Artísticos', descripcion: 'Presentaciones en vivo de artistas y grupos musicales', tarifaHoraBaseReferencial: 60000 },
                { nombre: 'Conciertos', descripcion: 'Eventos musicales en vivo con gran afluencia de público', tarifaHoraBaseReferencial: 60000 },
                { nombre: 'Fiestas Empresariales', descripcion: 'Eventos corporativos para celebrar logros o motivar al personal', tarifaHoraBaseReferencial: 30000 },
                { nombre: 'Cenas de Gala', descripcion: 'Eventos formales con cena incluida', tarifaHoraBaseReferencial: 35000 },
                { nombre: 'Corporativos', descripcion: 'Eventos organizados por empresas para diversos fines', tarifaHoraBaseReferencial: 20000 },
                { nombre: 'Matrimonios', descripcion: 'Ceremonias y celebraciones de bodas', tarifaHoraBaseReferencial: 20000 },
                { nombre: 'Aniversarios', descripcion: 'Celebraciones de aniversarios personales o corporativos', tarifaHoraBaseReferencial: 20000 },
            ];
            await prisma.tipoEvento.createMany({ data: tiposEvento });
            console.log('Tipos de eventos sembrados correctamente.');
        }
        else {
            console.log('Tipos de eventos ya existen en la base de datos.');
        }
    } catch(error) {
        console.error('Error al sembrar tipos de eventos:', error);
    }
}

async function seedCentroEventos(){
    try {
        const countCentroEvento = await prisma.centroEvento.count();
        if(countCentroEvento === 0){
            const centrosEvento = [
                { nombre: 'Centro de Eventos la Cúpula', direccionExacta: 'Concepción', capacidadPersonas: 1000 },
                { nombre: 'Espacio Pérgola', direccionExacta: 'Concepción', capacidadPersonas: 500 },
                { nombre: 'Salón los Nogales', direccionExacta: 'Concepción', capacidadPersonas: 300 },
                { nombre: 'Centro Cultural el Parque', direccionExacta: 'Concepción', capacidadPersonas: 400},
                { nombre: 'Bodega 15', direccionExacta: 'Concepción', capacidadPersonas: 800 },
                { nombre: 'Hotel Kennedy', direccionExacta: 'Concepción', capacidadPersonas: 250 },
                { nombre: 'Espacio Riesco', direccionExacta: 'Concepción', capacidadPersonas: 2000 }
            ];
            await prisma.centroEvento.createMany({ data: centrosEvento });
            console.log('Centros de eventos sembrados correctamente.');
        }
        else {
            console.log('Centros de eventos ya existen en la base de datos.');
        }
    } catch(error) {
        console.error('Error al sembrar centros de eventos:', error);
    }
}

async function seedBanqueteria(){
    try {
        const countBanqueteria = await prisma.banqueteria.count();
        if(countBanqueteria === 0){
            const banqueterias = [
                { nombre: 'Menú 3 tiempos', descripcion: 'Incluye entrada, plato principal y postre, alimentos conversables', precioPersonaReferencial: 27000 },
                { nombre: 'Coctel liviano', descripcion: 'Incluye una variedad de picoteos y aperitivos', precioPersonaReferencial: 10000 }
            ];
            await prisma.banqueteria.createMany({ data: banqueterias });
            console.log('Banqueteria sembrada correctamente.');
        }
        else {
            console.log('Banqueteria ya existe en la base de datos.');
        }
    } catch(error) {
        console.error('Error al sembrar banqueteria:', error);
    }
}

async function seedCatalogosPresupuesto(){
    const categorias = [
        { nombre: 'Audio' },
        { nombre: 'Iluminacion' },
        { nombre: 'Escenario' }
    ];

    const categoriasCreadas = {};
    for (const categoria of categorias) {
        categoriasCreadas[categoria.nombre] = await prisma.categoria.upsert({
            where: { nombre: categoria.nombre },
            update: {},
            create: categoria
        });
    }

    const equipos = [
        { nombre: 'Parlante activo', categoria: 'Audio', stockTotal: 20, arriendoHoraReferencial: 12000 },
        { nombre: 'Consola de sonido', categoria: 'Audio', stockTotal: 4, arriendoHoraReferencial: 25000 },
        { nombre: 'Pantalla LED', categoria: 'Iluminacion', stockTotal: 3, arriendoHoraReferencial: 90000 }
    ];

    const equiposCreados = {};
    for (const equipo of equipos) {
        equiposCreados[equipo.nombre] = await prisma.equipo.upsert({
            where: { nombre: equipo.nombre },
            update: {},
            create: {
                nombre: equipo.nombre,
                esExterno: false,
                stockTotal: equipo.stockTotal,
                stockNoDisponible: 0,
                arriendoHoraReferencial: equipo.arriendoHoraReferencial,
                codigoCategoria: categoriasCreadas[equipo.categoria].codigo
            }
        });
    }

    const especialidades = [
        { nombre: 'Tecnico de sonido', tarifaHoraReferencial: 15000 },
        { nombre: 'Garzon', tarifaHoraReferencial: 8000 },
        { nombre: 'Productor general', tarifaHoraReferencial: 22000 }
    ];

    const especialidadesCreadas = {};
    for (const especialidad of especialidades) {
        especialidadesCreadas[especialidad.nombre] = await prisma.especialidad.upsert({
            where: { nombre: especialidad.nombre },
            update: {},
            create: especialidad
        });
    }

    const tiposEvento = {};
    for (const nombre of ['Conciertos', 'Matrimonios', 'Seminarios']) {
        tiposEvento[nombre] = await prisma.tipoEvento.findUnique({ where: { nombre } });
    }

    const plantillas = [
        { tipo: 'Conciertos', equipo: 'Parlante activo', cantidadFija: 4, ratioInvitados: 100 },
        { tipo: 'Conciertos', especialidad: 'Tecnico de sonido', cantidadFija: 2, ratioInvitados: 200 },
        { tipo: 'Matrimonios', equipo: 'Parlante activo', cantidadFija: 2, ratioInvitados: 0 },
        { tipo: 'Matrimonios', especialidad: 'Garzon', cantidadFija: 0, ratioInvitados: 20 },
        { tipo: 'Seminarios', equipo: 'Pantalla LED', cantidadFija: 1, ratioInvitados: 0 },
        { tipo: 'Seminarios', especialidad: 'Tecnico de sonido', cantidadFija: 1, ratioInvitados: 250 }
    ];

    for (const plantilla of plantillas) {
        const tipoEvento = tiposEvento[plantilla.tipo];
        if (!tipoEvento) continue;

        const codigoEquipo = plantilla.equipo ? equiposCreados[plantilla.equipo].codigo : null;
        const codigoEspecialidad = plantilla.especialidad ? especialidadesCreadas[plantilla.especialidad].codigo : null;
        const existingPlantilla = await prisma.plantilla.findFirst({
            where: { codigoTipoEvento: tipoEvento.codigo, codigoEquipo, codigoEspecialidad }
        });

        if (!existingPlantilla) {
            await prisma.plantilla.create({
                data: {
                    codigoTipoEvento: tipoEvento.codigo,
                    codigoEquipo,
                    codigoEspecialidad,
                    cantidadFija: plantilla.cantidadFija,
                    ratioInvitados: plantilla.ratioInvitados
                }
            });
        }
    }

    console.log('Catalogos de presupuesto de prueba sembrados (valores demostrativos).');
}






async function main(){
    console.log('Sembrando la base de datos...');
    await seedRegiones();
    await seedComunas();
    await seedPersonas();
    await seedClientes();
    await seedTrabajadores();
    await seedUsuarios();
    await seedTipoEventos();
    await seedCentroEventos();
    await seedBanqueteria();
    await seedCatalogosPresupuesto();
}

main()
    .catch(e => {
        console.error('Error al sembrar la base de datos:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });