-- CreateEnum
CREATE TYPE "public"."TipoColaborador" AS ENUM ('CLT', 'PJ');

-- CreateEnum
CREATE TYPE "public"."TipoRegistro" AS ENUM ('ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA');

-- CreateTable
CREATE TABLE "public"."Colaborador" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "cargo" VARCHAR(100) NOT NULL,
    "data_admissao" DATE NOT NULL,
    "tipo" "public"."TipoColaborador" NOT NULL,

    CONSTRAINT "Colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ponto" (
    "id" SERIAL NOT NULL,
    "colaborador_id" INTEGER NOT NULL,
    "data_hora" TIMESTAMP(6) NOT NULL,
    "tipo_registro" "public"."TipoRegistro" NOT NULL,
    "localizacao" VARCHAR(255),
    "justificativa" TEXT,

    CONSTRAINT "Ponto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_email_key" ON "public"."Colaborador"("email");

-- AddForeignKey
ALTER TABLE "public"."Ponto" ADD CONSTRAINT "Ponto_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "public"."Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
