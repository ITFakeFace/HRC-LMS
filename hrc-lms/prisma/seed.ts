import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.role.createMany({
        data: [
            {fullname: "CUSTOMER", shortname: "CUSTOMER"},
            {fullname: "ADMINISTRATOR", shortname: "ADMIN"},
        ],
        skipDuplicates: true, // tránh lỗi nếu đã tồn tại
    });
}

main()
    .then(() => {
        console.log("✅ Seed complete");
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });