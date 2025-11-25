#!/usr/bin/env node
import { execSync } from 'node:child_process';

function log(message) {
	console.log(`[verify-prisma] ${message}`);
}

if (!process.env.TURSO_DATABASE_URL) {
	process.env.TURSO_DATABASE_URL = 'file:./dev.db';
	log('TURSO_DATABASE_URL no definido. Usando fallback file:./dev.db solo para validaciones.');
}

function run(command, description) {
	try {
		log(description);
		execSync(command, { stdio: 'inherit' });
	} catch (error) {
		log(`Error ejecutando "${command}"`);
		console.error(error?.message || error);
		process.exit(1);
	}
}

run('npx prisma --version', 'Verificando versión de Prisma CLI...');
run('npx prisma validate', 'Validando schema prisma/schema.prisma...');

log('Verificaciones de Prisma completadas.');
