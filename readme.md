
# SmartBreath API Backend 🌬️

ยินดีต้อนรับสู่โปรเจกต์ SmartBreath API Backend\! นี่คือ REST API ที่สร้างขึ้นด้วย Node.js, Express และ Sequelize สำหรับจัดการข้อมูลผู้ใช้, อุปกรณ์ (เครื่องวัด), และบันทึกข้อมูลการวัดค่าต่างๆ พร้อมระบบยืนยันตัวตนที่ปลอดภัยด้วย JWT

## ✨ คุณสมบัติหลัก (Features)

  * **User Management**: ระบบจัดการข้อมูลผู้ใช้ (CRUD - Create, Read, Update, Delete)
  * **Device Management**: ระบบจัดการอุปกรณ์หรือเครื่องวัด (CRUD) ที่ผูกกับผู้ใช้ที่เป็นเจ้าของ
  * **Record Management**: ระบบจัดการบันทึกข้อมูลการวัดค่าต่างๆ จากอุปกรณ์
  * **Authentication**: ระบบ Login ที่ปลอดภัยด้วย **JSON Web Tokens (JWT)** เพื่อยืนยันตัวตน
  * **Authorization**: ระบบตรวจสอบสิทธิ์ เพื่อให้แน่ใจว่าผู้ใช้จะสามารถเข้าถึงและจัดการได้เฉพาะข้อมูลของตนเองเท่านั้น

## ⚙️ เทคโนโลยีที่ใช้ (Tech Stack)

  * **Backend**: Node.js, Express.js
  * **Database**: MySQL
  * **ORM**: Sequelize
  * **Authentication**: JSON Web Tokens (jsonwebtoken), bcryptjs
  * **Development**: Nodemon

-----

## 🚀 เริ่มต้นใช้งาน (Getting Started)

ทำตามขั้นตอนต่อไปนี้เพื่อติดตั้งและรันโปรเจกต์บนเครื่องของคุณ

### 1\. สิ่งที่ต้องมี (Prerequisites)

  * [Node.js](https://nodejs.org/) (แนะนำเวอร์ชัน 18.x ขึ้นไป)
  * [NPM](https://www.npmjs.com/) (มาพร้อมกับ Node.js)
  * [MySQL](https://www.mysql.com/) Server

### 2\. การติดตั้ง (Installation)

1.  **Clone a repository**

    ```bash
    git clone <your-repository-url>
    cd <your-project-folder>
    ```

2.  **ติดตั้ง Dependencies**

    ```bash
    npm install
    ```

3.  **ตั้งค่าฐานข้อมูล**

      * เปิดโปรแกรมจัดการฐานข้อมูล (เช่น HeidiSQL, DBeaver, MySQL Workbench)
      * สร้างฐานข้อมูลใหม่ชื่อ `smartbreath`
      * รันสคริปต์ SQL เพื่อสร้างตาราง `users`, `smartbreath_machine`, และ `smartbreath_record` (ตามสคริปต์ที่เคยให้ไว้)

4.  **ตั้งค่า Environment Variables**

      * สร้างไฟล์ `.env` ในโฟลเดอร์หลักของโปรเจกต์ โดยคัดลอกเนื้อหาจากไฟล์ `.env.example` (ถ้ามี) หรือสร้างขึ้นมาใหม่ตามนี้:

    <!-- end list -->

    ```env
    # Database Configuration
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_mysql_password # <-- แก้เป็นรหัสผ่าน MySQL ของคุณ
    DB_NAME=smartbreath
    DB_DIALECT=mysql

    # JWT Configuration
    JWT_SECRET=your-super-secret-key-that-is-long-and-random # <-- แก้เป็น Secret Key ที่คาดเดายาก
    JWT_EXPIRES_IN=1h
    ```

### 3\. รันแอปพลิเคชัน

  * **สำหรับ Development** (เซิร์ฟเวอร์จะรีสตาร์ทอัตโนมัติเมื่อแก้ไขโค้ด):
    ```bash
    npm run dev
    ```
  * **สำหรับ Production**:
    ```bash
    npm start
    ```

เซิร์ฟเวอร์จะเริ่มทำงานที่ `http://localhost:8080` (หรือ Port ที่คุณตั้งค่าไว้)

-----

## 📚 เอกสาร API Endpoints

### 🔑 Authentication

| Method | Endpoint             | Description              | Authentication | Request Body                 |
| :----- | :------------------- | :----------------------- | :------------- | :--------------------------- |
| `POST` | `/api/auth/login`    | เข้าสู่ระบบเพื่อรับ Token | ไม่ต้อง         | `{ "username", "password" }` |

### 👤 Users

| Method | Endpoint             | Description                       | Authentication |
| :----- | :------------------- | :-------------------------------- | :------------- |
| `POST` | `/api/users`         | สมัครสมาชิกใหม่                    | ไม่ต้อง         |
| `GET`  | `/api/users/:id`     | ดูข้อมูลผู้ใช้คนเดียว               | **ต้องมี** |
| `PUT`  | `/api/users/:id`     | แก้ไขข้อมูลผู้ใช้ (เฉพาะของตนเอง)    | **ต้องมี** |
| `DELETE`| `/api/users/:id`     | ลบผู้ใช้ (เฉพาะของตนเอง)           | **ต้องมี** |

### 📠 Machines

| Method | Endpoint             | Description                         | Authentication |
| :----- | :------------------- | :---------------------------------- | :------------- |
| `POST` | `/api/machines`      | ลงทะเบียนเครื่องใหม่                  | **ต้องมี** |
| `GET`  | `/api/machines`      | ดูรายการเครื่องทั้งหมด (เฉพาะของตนเอง) | **ต้องมี** |
| `GET`  | `/api/machines/:id`  | ดูข้อมูลเครื่องเดียว (เฉพาะของตนเอง)   | **ต้องมี** |
| `PUT`  | `/api/machines/:id`  | แก้ไขข้อมูลเครื่อง (เฉพาะของตนเอง)     | **ต้องมี** |
| `DELETE`| `/api/machines/:id`  | ลบเครื่อง (เฉพาะของตนเอง)            | **ต้องมี** |

### 📈 Records

| Method | Endpoint             | Description                                          | Authentication |
| :----- | :------------------- | :--------------------------------------------------- | :------------- |
| `POST` | `/api/records`       | บันทึกข้อมูลการวัดค่าใหม่                               | ไม่ต้อง   |
| `GET`  | `/api/records`       | ดูข้อมูลการวัดทั้งหมด (ต้องระบุ `?machineId=...`)    | **ต้องมี** |
| `GET`  | `/api/records/:id`   | ดูข้อมูลการวัดเดียว (เฉพาะของตนเอง)                      | **ต้องมี** |
| `DELETE`| `/api/records/:id`   | ลบข้อมูลการวัด (เฉพาะของตนเอง)                        | **ต้องมี** |

**หมายเหตุ**: Endpoint ที่ต้องมี Authentication จะต้องแนบ `token` ที่ได้จากการ Login มาใน `Authorization` header ในรูปแบบ `Bearer <your_token>`