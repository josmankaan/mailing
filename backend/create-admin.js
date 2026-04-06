const db = require('./src/models');

async function createAdmin(username, email, password) {
  try {
    let user = await db.User.findOne({ where: { username } });

    if (user) {
      user.isAdmin = true;
      user.email = email;
      await user.save();
      console.log(`User ${username} promoted to admin.`);
    } else {
      user = await db.User.create({
        username,
        email,
        password,
        isAdmin: true,
        tokens: 999999
      });
      console.log(`Admin user ${username} created.`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node create-admin.js <username> <email> <password>');
  process.exit(1);
}

createAdmin(args[0], args[1], args[2]);
