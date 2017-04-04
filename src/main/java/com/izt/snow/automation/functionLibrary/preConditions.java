package com.izt.snow.automation.functionLibrary;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

import org.apache.poi.hssf.usermodel.HSSFRow;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.openqa.selenium.support.PageFactory;

import com.izt.snow.automation.pageObject.HomePage_Repository;
import com.izt.snow.automation.webdriver.BaseClass;
import com.izt.snow.automation.webdriver.Driver;

/**
 * 
 * @author Bharath
 *
 */
/*
 * Creating Pre-Required documents before running script 
 */
public class preConditions {
	
	BaseClass baseMethod = new BaseClass();

	public void createExcel() throws IOException {
		String myDocumentPath = System.getProperty("user.home")
				+ "\\Desktop\\Incident_Management.xls";
		File fileName = new File(myDocumentPath);
		fileName.createNewFile();
		HSSFWorkbook workbook = new HSSFWorkbook();
		HSSFSheet sheet = workbook.createSheet("Incident");
		HSSFRow rowhead = sheet.createRow((short) 0);
		rowhead.createCell(0).setCellValue("Sno");
		rowhead.createCell(1).setCellValue("Label");
		rowhead.createCell(2).setCellValue("Values");

		FileOutputStream fileOut = new FileOutputStream(myDocumentPath);
		workbook.write(fileOut);
		fileOut.close();

	}

	public void ExcelPath() throws IOException {
		String myDocumentPath = System.getProperty("user.home")
				+ "\\Desktop\\Incident_Management.xls";
		File fileName = new File(myDocumentPath);
		fileName.createNewFile();

		baseMethod.addData("excelPath", myDocumentPath, "home.properties");

	}
	public void tabbedView() throws InterruptedException{
		HomePage_Repository home=PageFactory.initElements(Driver.driver, HomePage_Repository.class);

		try {
			home.getSettingsButtonUI15().click();
			Thread.sleep(3000);
			home.getTabbedFormButtonUI15().click();
			Thread.sleep(3000);
		} catch (Exception e) {

			home.getSettingsButtonUI16().click();
			Thread.sleep(3000);
			home.getFormTabUI16().click();
			Thread.sleep(2000);
			home.getTabbedFormButtonUI16().click();
			Thread.sleep(2000);
			home.getCloseButtonUI16().click();

		}
		
	}
	
	
	
	

}
