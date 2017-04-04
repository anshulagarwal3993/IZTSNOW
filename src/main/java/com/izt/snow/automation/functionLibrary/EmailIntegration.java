package com.izt.snow.automation.functionLibrary;

import java.util.Properties;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Properties;
import javax.activation.DataHandler;
import javax.activation.DataSource;
import javax.activation.FileDataSource;
import javax.mail.BodyPart;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Multipart;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;


/**
 * 
 * @author Bharath
 *
 */
/*
 * Email Integration 
 */
public class EmailIntegration {
	
	
	public static void main(String[] args) {
		 
		Properties props = new Properties();

		// this will set host of server- you can change based on your
		// requirement
		props.put("mail.smtp.host", "smtp.gmail.com");

		// set the port of socket factory
		props.put("mail.smtp.socketFactory.port", "465");

		// set socket factory
		props.put("mail.smtp.socketFactory.class",
				"javax.net.ssl.SSLSocketFactory");

		props.put("mail.smtp.auth", "true");

		// set the port of SMTP server
		props.put("mail.smtp.port", "465");

		Session session = Session.getDefaultInstance(props,
				new javax.mail.Authenticator() {
					protected PasswordAuthentication getPasswordAuthentication() {
						return new PasswordAuthentication(
								"", "");
					}
				});

		DateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
		Date date = new Date();

		try {

			Message message = new MimeMessage(session);

			// Set the from address
			message.setFrom(new InternetAddress("test.bharath012@gmail.com"));

			// Set the recipient address TO
			message.setRecipients(Message.RecipientType.TO,
					InternetAddress.parse("bharath.ganta@inputzero.com"));

			// Set the recipient address CC
			message.setRecipients(Message.RecipientType.CC,
					InternetAddress.parse("test.bharath012@gmail.com"));

			// Add the subject link
			message.setSubject("SNOW Automation Test Report" + "  "
					+ dateFormat.format(date));

			BodyPart messageBodyPart1 = new MimeBodyPart();

			messageBodyPart1.setText("PFA of SNOW Automation Testing Report");

			MimeBodyPart messageBodyPart2 = new MimeBodyPart();

			// Mention the file which you want to send
			String filename = "F:\\workspace\\IZTGenericAutomationTestSuit\\test-output\\emailable-report.html";

			DataSource source = new FileDataSource(filename);

			messageBodyPart2.setDataHandler(new DataHandler(source));

			messageBodyPart2.setFileName(filename);

			Multipart multipart = new MimeMultipart();

			multipart.addBodyPart(messageBodyPart2);

			multipart.addBodyPart(messageBodyPart1);

			message.setContent(multipart);

			Transport.send(message);

			System.out.println("=====Email Sent=====");

		} catch (MessagingException e) {

			throw new RuntimeException(e);

		}

	}
	

}
