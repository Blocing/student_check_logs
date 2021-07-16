const { getConn } = require("../../../config/pool");
const { send } = require("../../../sdk/sdk");
const moment = require("moment");

require("dotenv").config();

const getAttendanceStatus = (start_time, end_time) => {
  let now = new Date();
  let date = now.getDate(); // ?��?��?��筌욑?��
  
  let hour = now.getHours(); // ?��?��?��?��?���??
  let minute = now.getMinutes();
  let second = now.getSeconds();
  const start_hour = Number(start_time.substr(0, 2));
  const start_minute = Number(start_time.substr(3, 2));
  const start_second = Number(start_time.substr(6, 2));

  const end_hour = Number(end_time.substr(0, 2));
  const end_minute = Number(end_time.substr(3, 2));
  const end_second = Number(end_time.substr(6, 2));
  
  if(hour < start_hour) return ' ';
  else if(hour == start_hour && minute == start_minute) return "PRESENT";
  else if(start_minute < 45 && hour == start_hour && minute <= start_minute + 15) return "PRESENT";
  else if(start_minute < 45 && hour == start_hour && minute > start_minute + 15) return "LATE";
  else if((hour == start_hour + 1) &&  minute <= ((start_minute + 15) % 60)) "PRESENT";
  else if(hour <= end_hour && minute <= end_minute) return "LATE"
  return 'ABSENT';
}

const attendanceService = {
  addAttendance: async (request) => {
    // id, holder_id, class_id, verifier_id, time
    let conn;
    try {
      conn = await getConn();
      const [[rows]] = await conn.query("SELECT * FROM Class WHERE id = ?", [request.class_id]);
      const class_start_time = rows.start_time;
      const class_end_time = rows.end_time;
            
      console.log(request);
      const newAttendance = {
        holder_id : request.holder_id,
        class_id : request.class_id,
        time : moment().format("YYYY-MM-DD HH:mm:ss"),
        status : getAttendanceStatus(class_start_time, class_end_time),
        verifier_id : 1
      };

      await conn.execute(
        "INSERT INTO Attendance(holder_id, class_id, verifier_id, time, status) values(?, ?, ?, ?, ?)",
        [
          newAttendance.holder_id,
          newAttendance.class_id,
          newAttendance.verifier_id,
          newAttendance.time,
          newAttendance.status
        ]
      );
      
      const [[datas]] = await conn.query(
        "SELECT id, holder_id, class_id, verifier_id, time, status FROM Attendance order by id DESC limit 1"
        // "SELECT id, holder_id, class_id, verifier_id, time, status FROM Attendance WHERE holder_id = ? AND class_id = ?",
        // [newAttendance.holder_id, newAttendance.class_id]
      );

      // Attendance{attendance_id, class_id, holder_id, status, time, verifier_id}
      let args = [
        String(datas.id),
        String(datas.class_id),
        String(datas.holder_id),
        datas.status,
        datas.time,
        String(datas.verifier_id)
      ];

      console.log("=========== 블록 체인 내 출석 체크 자동 함수 호출 (setAttendance)===========");
      const result = await send(1, "setAttendance", args);
      console.log(`Transcation ${result}`);
      return datas.id;
      
    } catch (e) {
      console.error(e);
    } finally {
      if (conn) conn.release();
    }
  },
  getClass: async () => {
    let conn;
    try {
      conn = await getConn();
      const [rows] = await conn.query("SELECT * FROM Class");
      let results = [];

      rows.forEach((item, index) => {
        let result = {};
        result.id = item.id;
        result.name = item.name;
        results.push(result);
      })
      // console.log(results);
      return results;

    } catch (e) {
      console.error(e);
    } finally {
      if (conn) conn.release();
    }
  },
  getAttendanceList: async (class_id, holder_id) => {
    let conn;
    try {
      conn = await getConn();
      const [[rows]] = await conn.query("SELECT * FROM Holder WHERE id = ?", [holder_id]);
      const holder = rows;
      console.log(holder);

      const [data] = await conn.query("SELECT * FROM Attendance WHERE class_id = ? AND holder_id = ?", [class_id, holder_id]);
      console.log(data);

      // const args = [String(holder_id), String(class_id)];
      // console.log(args);
      console.log("=========== 블록 체인 내 출석 검증 및 조회 자동 함수 호출 (setAttendance)===========");
      // const result = await send(0, "getAttendance", args);
      // console.log(result);

      // {
      //   Attendance_id: '52',
      //   Class_id: '1',
      //   Holder_id: '107',
      //   Status: 'ABSENT',
      //   Time: '2021-04-26 16:15:26',
      //   Verifier_id: '1'
      // }
      const results = [];
      data.forEach((item, index) => {
        let result = {};
        result.id = item.id;
        result.status = item.status;
        result.time = item.time;
        results.push(result);
      })

      console.log(results);

      return results;

    } catch (e) {
      console.error(e);
    } finally {
      if (conn) conn.release();
    }
  }
};

// attendanceService.getAttendanceList(2, 107);

module.exports = {
  attendanceService
}
