const { getConn } = require("../../../config/pool");
const { send } = require("../../../sdk/sdk");
const moment = require("moment");

require("dotenv").config();

const getAttendanceStatus = (start_time, end_time) => {
  let now = new Date();
  let date = now.getDate(); // ?��?��?��筌욑?��
  const utc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
  const kr_now = new Date(utc + (KR_TIME_DIFF));


  let hour = Number(kr_now.getHours()); // ?��?��?��?��?���??
  let minute = Number(kr_now.getMinutes());
  let second = Number(kr_now.getSeconds());

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
  else if((hour == start_hour + 1) &&  minute <= ((start_minute + 15) % 60)) return "PRESENT";
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
      let now = new Date();
      let today = new Date((now.getTime() + (now.getTimezoneOffset()*60*1000)) + (9*60*60*1000));
      let year = today.getFullYear();
      let month = today.getMonth() + 1;
      let date = today.getDate();
      let hour = today.getHours();
      let minute = today.getMinutes();
      let second = today.getSeconds();


      const newAttendance = {
        holder_id : request.holder_id,
        class_id : request.class_id,
        time : moment(year + "-" + month + "-" + date + " " + hour+":"+minute+":"+second, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"),
        status : getAttendanceStatus(class_start_time, class_end_time),
        verifier_id : 1
      };
	if(newAttendance.statue === ' ') return ' ';
	    else{
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

      const result = await send(1, "setAttendance", args);
      return datas.id;
	    }
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

      const [data] = await conn.query("SELECT * FROM Attendance WHERE class_id = ? AND holder_id = ?", [class_id, holder_id]);

      const results = [];
      data.forEach((item, index) => {
        let result = {};
        result.id = item.id;
        result.status = item.status;
        result.time = item.time;
        results.push(result);
      })


      return results;

    } catch (e) {
      console.error(e);
    } finally {
      if (conn) conn.release();
    }
  }
};


module.exports = {
  attendanceService
}
