import Fastify from "fastify";
import { read, readFileSync, writeFileSync } from "fs";
import cors from "@fastify/cors";
import { models } from "./models";

import { FastifyZod, buildJsonSchemas, register } from "fastify-zod";

// Global augmentation, as suggested by
// https://www.fastify.io/docs/latest/Reference/TypeScript/#creating-a-typescript-fastify-plugin
declare module "fastify" {
	interface FastifyInstance {
		readonly zod: FastifyZod<typeof models>;
	}
}

type Pokemon = {
	name: string;
	hp: number;
	attribute1: string;
	attribute2?: string;
};

export function readDB() {
	return JSON.parse(
		readFileSync("./db.json", {
			encoding: "utf8"
		})
	);
}

function writeDB(data: any) {
	writeFileSync("./db.json", JSON.stringify(data));
}

async function init() {
	const { schemas, $ref } = buildJsonSchemas(models);

	// Require the framework and instantiate it
	const fastify = await register(Fastify({ logger: true }), {
		jsonSchemas: { schemas, $ref }
	});

	fastify.register(cors, { origin: ["*"] });

	// Declare a route/endpoint
	fastify.get(
		"/pokemon/query",
		{
			schema: {
				querystring: $ref(`queryPokemon`)
			}
		},
		async (request, reply) => {
			const pokemon = readDB().pokemon;

			return pokemon.map((pokemon: any) => {
				return pokemon.name;
			});
		}
	);

	fastify.get("/pokemon", {}, async (request, reply) => {
		return readDB().pokemon;
	});

	fastify.post(
		"/pokemon",
		{
			schema: {
				body: $ref(`postPokemon`)
			}
		},
		async (request, reply) => {
			const pokemon = request.body as Pokemon;

			//@ts-ignore
			const list: Pokemon[] = readDB().pokemon;
			list.push(pokemon);

			writeDB({ pokemon: list });
		}
	);

	// fastify.put(
	// 	"/pokemon/:name",
	// 	{
	// 		schema: {
	// 			body: $ref(``)
	// 		}
	// 	},
	// 	async (request, reply) => {
	// 		//@ts-ignore
	// 		const { name } = request.params;
	// 		console.log(name);
	// 		const newPokemon = request.body as Pokemon;

	// 		let list: Pokemon[] = readDB().pokemon;

	// 		const pokemon = list.find((pokemon) => {
	// 			return pokemon.name == name;
	// 		});

	// 		if (!pokemon) {
	// 			reply.status(404);
	// 			reply.send(`Could not find any pokemon called ${name}.`);
	// 			return;
	// 		}

	// 		list = list.filter((pokemon) => {
	// 			return !(pokemon.name == name);
	// 		});

	// 		list.push({
	// 			...newPokemon,
	// 			name: name
	// 		});

	// 		writeDB({ pokemon: list });

	// 		reply.status(200);
	// 	}
	// );

	// fastify.patch(
	// 	"/pokemon/:name",
	// 	{ schema: { body: $ref(``) } },
	// 	async (request, reply) => {
	// 		//@ts-ignore
	// 		const { name } = request.params;
	// 		console.log(name);
	// 		const updatedFields = request.body as Pokemon;

	// 		let list: Pokemon[] = readDB().pokemon;

	// 		const pokemon = list.find((pokemon) => {
	// 			return pokemon.name == name;
	// 		});

	// 		if (!pokemon) {
	// 			reply.status(404);
	// 			reply.send(`Could not find any pokemon called ${name}.`);
	// 			return;
	// 		}

	// 		list = list.filter((pokemon) => {
	// 			return !(pokemon.name == name);
	// 		});

	// 		list.push({
	// 			...pokemon,
	// 			...updatedFields,
	// 			name: name
	// 		});

	// 		writeDB(list);
	// 	}
	// );

	// fastify.delete(
	// 	"/pokemon/:name",
	// 	{
	// 		schema: { body: $ref(``) }
	// 	},
	// 	async (request, reply) => {
	// 		//@ts-ignore
	// 		const { name } = request.params;

	// 		let list: Pokemon[] = readDB().pokemon;

	// 		const pokemon = list.find((pokemon) => {
	// 			return pokemon.name == name;
	// 		});

	// 		if (!pokemon) {
	// 			reply.status(404);
	// 			reply.send(`Could not find any pokemon called ${name}.`);
	// 			return;
	// 		}

	// 		list = list.filter((pokemon) => {
	// 			return !(pokemon.name == name);
	// 		});

	// 		writeDB(list);
	// 	}
	// );

	// Run the server!
	await fastify.listen({ port: 3000, host: "127.0.0.1" });
}

try {
	init();
} catch (err) {
	// fastify.log.error(err);
	process.exit(1);
}
