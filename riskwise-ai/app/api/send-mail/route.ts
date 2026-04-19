import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { students, type } = await req.json();

    if (!students || students.length === 0) {
      return NextResponse.json({ success: false, error: "No students to notify." }, { status: 400 });
    }

    const results: { name: string; sent: boolean }[] = [];

    for (const student of students) {
      if (!student.parent_email) {
        results.push({ name: student.name, sent: false });
        continue;
      }

      let subject = "";
      let text = "";

      if (type === "WARNING") {
        // Only send if conditions are met: High Risk OR attendance < 60% OR marks < 35
        const avgMarks = student.avg_marks ?? 100;
        const avgAttendance = student.avg_attendance ?? 100;
        const riskCategory = student.risk_category ?? "Low";

        const shouldSend = riskCategory === "High" || avgAttendance < 60 || avgMarks < 35;
        if (!shouldSend) {
          results.push({ name: student.name, sent: false });
          continue;
        }

        subject = `Urgent Academic Warning — ${student.name}`;
        text = `Respected Parent/Guardian,

This is an automated alert from RiskWise AI on behalf of the institution.

We wish to inform you that your child, ${student.name}, requires immediate academic attention.

Current Academic Summary:
- Risk Classification: ${riskCategory}
- Average Marks: ${avgMarks}%
- Average Attendance: ${avgAttendance}%

We strongly recommend you contact the faculty coordinator or mentor immediately to discuss an action plan before the final examinations.

This is an automated message. Please do not reply to this email.

With regards,
RiskWise AI — Automated Academic Safety System`;

      } else if (type === "RETENTION") {
        subject = `Regarding the Academic Future of ${student.name}`;
        text = `Respected Parent/Guardian,

I am writing to you from the Academic Department regarding your child, ${student.name}.

We have received word that there may be concerns about ${student.name}'s continuation of studies. While we fully respect your family's circumstances, we wanted to personally reach out.

${student.name} is a student with real potential. Completing this degree could provide long-term stability and open doors to respected career opportunities.

If your concerns are regarding fees, travel, or any other matter, please visit the college so we can discuss possible scholarship solutions that might help. We would be very proud to see ${student.name} graduate.

With deep respect,
RiskWise AI — Faculty Retention Program`;
      }

      try {
        await transporter.sendMail({
          from: `"RiskWise AI" <${process.env.EMAIL_USER}>`,
          to: student.parent_email,
          subject,
          text,
        });
        results.push({ name: student.name, sent: true });
      } catch {
        results.push({ name: student.name, sent: false });
      }
    }

    const sent = results.filter(r => r.sent).length;
    return NextResponse.json({ success: true, sent, total: students.length, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
