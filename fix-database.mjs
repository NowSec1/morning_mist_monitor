import mysql from 'mysql2/promise';

async function fixDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'morning_mist_db',
  });

  try {
    console.log('=== 数据库修复开始 ===\n');

    // 检查authType字段是否存在
    console.log('1. 检查authType字段...');
    const [columns] = await connection.query('DESCRIBE users');
    const authTypeColumn = columns.find(col => col.Field === 'authType');
    
    if (!authTypeColumn) {
      console.log('   authType字段不存在，添加中...');
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN authType ENUM('local', 'manus') DEFAULT 'manus' NOT NULL
      `);
      console.log('   ✓ authType字段已添加');
    } else {
      console.log('   ✓ authType字段已存在');
    }

    // 检查isActive字段是否存在
    console.log('\n2. 检查isActive字段...');
    const [columns2] = await connection.query('DESCRIBE users');
    const isActiveColumn = columns2.find(col => col.Field === 'isActive');
    
    if (!isActiveColumn) {
      console.log('   isActive字段不存在，添加中...');
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN isActive BOOLEAN DEFAULT true NOT NULL
      `);
      console.log('   ✓ isActive字段已添加');
    } else {
      console.log('   ✓ isActive字段已存在');
    }

    // 检查username字段是否存在
    console.log('\n3. 检查username字段...');
    const [columns3] = await connection.query('DESCRIBE users');
    const usernameColumn = columns3.find(col => col.Field === 'username');
    
    if (!usernameColumn) {
      console.log('   username字段不存在，添加中...');
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN username VARCHAR(64) UNIQUE
      `);
      console.log('   ✓ username字段已添加');
    } else {
      console.log('   ✓ username字段已存在');
    }

    // 检查password字段是否存在
    console.log('\n4. 检查password字段...');
    const [columns4] = await connection.query('DESCRIBE users');
    const passwordColumn = columns4.find(col => col.Field === 'password');
    
    if (!passwordColumn) {
      console.log('   password字段不存在，添加中...');
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN password TEXT
      `);
      console.log('   ✓ password字段已添加');
    } else {
      console.log('   ✓ password字段已存在');
    }

    // 修改openId为可为null
    console.log('\n5. 修改openId字段为可为null...');
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN openId VARCHAR(64) NULL
    `);
    console.log('   ✓ openId字段已修改');

    // 检查用户名为test的用户
    console.log('\n6. 检查用户名为test的用户...');
    const [testUsers] = await connection.query(
      'SELECT id, username, authType, isActive FROM users WHERE username = ?',
      ['test']
    );
    
    if (testUsers.length > 0) {
      console.log('   ✓ 找到用户test');
      console.log('   用户信息:', testUsers[0]);
      
      // 确保authType为local
      if (testUsers[0].authType !== 'local') {
        console.log('   修正authType为local...');
        await connection.query(
          'UPDATE users SET authType = ? WHERE id = ?',
          ['local', testUsers[0].id]
        );
        console.log('   ✓ authType已修正');
      }
      
      // 确保isActive为true
      if (!testUsers[0].isActive) {
        console.log('   激活用户账户...');
        await connection.query(
          'UPDATE users SET isActive = ? WHERE id = ?',
          [true, testUsers[0].id]
        );
        console.log('   ✓ 用户账户已激活');
      }
    } else {
      console.log('   ✗ 未找到用户名为test的用户');
    }

    console.log('\n=== 数据库修复完成 ===');
  } catch (error) {
    console.error('修复失败:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixDatabase();
