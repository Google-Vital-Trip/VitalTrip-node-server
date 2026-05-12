-- TypeORM 시절 DATE 타입으로 생성된 birthDate 컬럼을 Prisma 스키마(VARCHAR(10))에 맞게 변환
ALTER TABLE users MODIFY COLUMN birthDate VARCHAR(10) NOT NULL;
