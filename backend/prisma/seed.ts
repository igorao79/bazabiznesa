import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check if data already exists
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  // Create users
  const dispatcher = await prisma.user.create({
    data: {
      username: "dispatcher",
      password: "dispatcher123",
      name: "Иванова Мария Петровна",
      role: "dispatcher",
    },
  });

  const master1 = await prisma.user.create({
    data: {
      username: "master1",
      password: "master123",
      name: "Сидоров Алексей Иванович",
      role: "master",
    },
  });

  const master2 = await prisma.user.create({
    data: {
      username: "master2",
      password: "master123",
      name: "Козлов Дмитрий Сергеевич",
      role: "master",
    },
  });

  console.log("Created users:", { dispatcher, master1, master2 });

  // Create sample requests
  const requests = await Promise.all([
    prisma.request.create({
      data: {
        clientName: "Петров Иван Сергеевич",
        phone: "+7 (999) 111-22-33",
        address: "ул. Ленина, д. 10, кв. 5",
        problemText: "Течёт кран на кухне, требуется замена смесителя",
        status: "new",
        priority: "normal",
      },
    }),
    prisma.request.create({
      data: {
        clientName: "Смирнова Елена Владимировна",
        phone: "+7 (999) 444-55-66",
        address: "пр. Мира, д. 25, кв. 12",
        problemText: "Не работает розетка в спальне, возможно короткое замыкание",
        status: "assigned",
        priority: "high",
        assignedTo: master1.id,
      },
    }),
    prisma.request.create({
      data: {
        clientName: "Кузнецов Андрей Павлович",
        phone: "+7 (999) 777-88-99",
        address: "ул. Гагарина, д. 3, кв. 45",
        problemText: "Засор в ванной, вода не уходит",
        status: "in_progress",
        priority: "urgent",
        assignedTo: master2.id,
      },
    }),
    prisma.request.create({
      data: {
        clientName: "Новикова Ольга Дмитриевна",
        phone: "+7 (999) 222-33-44",
        address: "ул. Пушкина, д. 17, кв. 8",
        problemText: "Скрипит дверь, нужна регулировка петель",
        status: "done",
        priority: "low",
        assignedTo: master1.id,
      },
    }),
    prisma.request.create({
      data: {
        clientName: "Морозов Сергей Александрович",
        phone: "+7 (999) 555-66-77",
        address: "пр. Победы, д. 42, кв. 101",
        problemText: "Протечка трубы в подвале, срочно нужен сантехник",
        status: "new",
        priority: "urgent",
      },
    }),
  ]);

  // Create audit logs for requests with non-new statuses
  const auditLogData = [
    { requestId: requests[1].id, userId: dispatcher.id, action: "Заявка назначена мастеру", oldStatus: "new", newStatus: "assigned", details: `Назначена мастеру: ${master1.name}` },
    { requestId: requests[2].id, userId: dispatcher.id, action: "Заявка назначена мастеру", oldStatus: "new", newStatus: "assigned", details: `Назначена мастеру: ${master2.name}` },
    { requestId: requests[2].id, userId: master2.id, action: "Заявка взята в работу", oldStatus: "assigned", newStatus: "in_progress" },
    { requestId: requests[3].id, userId: dispatcher.id, action: "Заявка назначена мастеру", oldStatus: "new", newStatus: "assigned", details: `Назначена мастеру: ${master1.name}` },
    { requestId: requests[3].id, userId: master1.id, action: "Заявка взята в работу", oldStatus: "assigned", newStatus: "in_progress" },
    { requestId: requests[3].id, userId: master1.id, action: "Заявка завершена", oldStatus: "in_progress", newStatus: "done" },
  ];
  for (const log of auditLogData) {
    await prisma.auditLog.create({ data: log });
  }

  // Create sample comments
  const commentData = [
    { requestId: requests[1].id, userId: dispatcher.id, text: "Клиент просит прийти после 18:00" },
    { requestId: requests[2].id, userId: master2.id, text: "Нужны дополнительные инструменты, возвращусь завтра" },
  ];
  for (const comment of commentData) {
    await prisma.comment.create({ data: comment });
  }

  console.log(`Created ${requests.length} requests with audit logs and comments`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
