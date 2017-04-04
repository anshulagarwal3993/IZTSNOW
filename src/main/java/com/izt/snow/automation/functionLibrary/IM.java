package com.izt.snow.automation.functionLibrary;

import java.io.IOException;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;
import org.testng.Reporter;

import com.izt.snow.automation.pageObject.Elements;
import com.izt.snow.automation.webdriver.BaseClass;
import com.izt.snow.automation.webdriver.Driver;
/**
 * 
 * @author Bharath
 *
 */
public class IM {

	BaseClass baseMethod = new BaseClass();
	Filter_Navigator filter = new Filter_Navigator();
	
	/**
	 * Step 1: Fetching Label From Excel Sheet (User Input) 
	 * Step 2: Based on User Input, searches for Label Tag Name from Properties file 
	 * Step 3: Based on Tag Name driver control passes 
	 * Step 4: Action Take place with Expected Value Selected by User
	 * 
	 * @throws EncryptedDocumentException
	 * @throws InvalidFormatException
	 * @throws IOException
	 * @throws InterruptedException
	 */
	public void incidentDataInsertion() throws EncryptedDocumentException,
			InvalidFormatException, IOException, InterruptedException {
		
		/* Creating objects and classes using Page Factory Desing Pattern */
		Elements ele = PageFactory.initElements(Driver.driver, Elements.class);

		int lastRowCount = baseMethod.getLastRowNumber("incident");

		Driver.driver.switchTo().defaultContent();
		Driver.driver.switchTo().frame("gsft_main");
		String ticketNumber = ele.getTicketnumber().getAttribute("value");
		baseMethod.addData("ticketNumber", ticketNumber, "incident.properties");

		for (int i = 0; i < lastRowCount; i++) {

			try {
				/* Selecting Values from Drop Down using Select Class */
				String data = baseMethod.getExcelData("incident", i + 1, 1);
				String label = data.replace(" ", "");

				String element = "inc." + label + "Tag";

				String tag = baseMethod
						.readData(element, "incident.properties");

				String expected = baseMethod.getExcelData("incident", i + 1, 2);

				/* Selecting Values from Drop Down using Select Class */

				if (tag.equalsIgnoreCase("select")) {
					String id = baseMethod.readData("inc." + label,
							"incident.properties");
					WebElement path = Driver.driver.findElement(By.id(id));
					baseMethod.selectDropdown(path, expected);

					/* Inserting Data into Input Fields */

				} else if (tag.equalsIgnoreCase("input")||tag.equalsIgnoreCase("textarea")) {
					String id = baseMethod.readData("inc." + label,
							"incident.properties");
					Driver.driver.findElement(By.id(id)).sendKeys(expected);
					/* For Selecting Link And navigating to other Window/Tab */
				} else if (tag.equalsIgnoreCase("a")) {
					String id = baseMethod.readData("inc." + label,
							"incident.properties");

					Driver.driver.findElement(By.id(id)).click();
					try {

						Set<String> set = Driver.driver.getWindowHandles();
						Iterator<String> itr = set.iterator();
						String parent = itr.next();
						String child = itr.next();
						Driver.driver.switchTo().window(child);
						baseMethod.pageLoadWait();

						String dropDown = ele.getSearchDropDown().getAttribute(
								"id");
						WebElement dropdown = Driver.driver.findElement(By
								.id(dropDown));

						baseMethod.selectDropdown(dropdown, "Name");
						Thread.sleep(2000);

						String inputElement = ele.getSearchInputEdit()
								.getAttribute("id");

						Driver.driver.findElement(By.id(inputElement))
								.sendKeys(expected);
						Thread.sleep(3000);
						baseMethod.actions();
						baseMethod.pageLoadWait();
						Thread.sleep(5000);

						baseMethod.selectFromList(ele.getCallerWindowList(),
								expected);

						Thread.sleep(3000);
						Driver.driver.switchTo().window(parent);
						Driver.driver.switchTo().defaultContent();
						Driver.driver.switchTo().frame("gsft_main");

					} catch (Exception e) {

						Driver.driver.switchTo().defaultContent();
						Driver.driver.switchTo().frame("gsft_main");

						List<WebElement> lst = Driver.driver
								.findElements(By
										.xpath("//tbody[@class='list_table_tbody']/tr/td[3]/span/a"));
						for (int j = 0; j < lst.size(); j++) {

							lst.get(i + 2).click();
							break;
						}
						Driver.driver.switchTo().defaultContent();
						Driver.driver.switchTo().frame("gsft_main");

					}
					/* Invalid Tag name Throws Error */
				} else {
					
				}

				Thread.sleep(3000);
			} catch (Exception e) {
				
			}
		}

		ele.getShortDescriptionEdit().sendKeys("test short description");
		String time = "";
//		try {
//			time = ele.getResponseTimeView().getAttribute("title");
//		} catch (Exception e) {
//			time = ele.getResponseTimeButton().getAttribute("title");
//		}
		//baseMethod.setExcelData("incident", 1, 5, time);
		try {
			String id = baseMethod
					.readData("inc.Submit", "incident.properties");
			Driver.driver.findElement(By.id(id)).click();

		} catch (Exception e) {
			String id = baseMethod.readData("inc.Save", "incident.properties");
			Driver.driver.findElement(By.id(id)).click();
		}

	}
	
	/*
	 * Updating Incident Status
	 * Step 1:Fetching Data from incidentStatusUpdate Method
	 * Step 2:Based on label and Tag Name driver control passes
	 * Step 3:Action take place with Expected value and clicks on Submit/Save
	 * Step 4:Once update completes incidentStatusUpdate Method Calls.
	 *  
	 */
	public void IncidentUpdate(int d) throws EncryptedDocumentException,
			InvalidFormatException, IOException, InterruptedException {
		/* Creating objects and classes using Page Factory Desing Pattern */
		Elements ele = PageFactory.initElements(Driver.driver, Elements.class);
		int lastRowCount = baseMethod.getLastRowNumber("incident");

		Driver.driver.switchTo().defaultContent();
		Driver.driver.switchTo().frame("gsft_main");

		/* Updating Status Before Selecting Mandetory fields */
		try {

			String id = baseMethod.readData("inc.State", "incident.properties");
			WebElement path = Driver.driver.findElement(By.id(id));
			String expected = baseMethod.getExcelData("incident", 0, d);
			baseMethod.selectDropdown(path, expected);
		} catch (Exception e) {

			String id = baseMethod
					.readData("inc.Status", "incident.properties");
			WebElement path = Driver.driver.findElement(By.id(id));
			String expected = baseMethod.getExcelData("incident", 0, d);
			baseMethod.selectDropdown(path, expected);
		}

		for (int i = 0; i < lastRowCount; i++) {

	try{

				/* Fetching Data from Excel Sheet and Parameter Files */
				String data = baseMethod.getExcelData("incident", i + 1, 1);
				String label = data.replace(" ", "");

				String element = "inc." + label + "Tag";

				String tag = baseMethod
						.readData(element, "incident.properties");

				String expected = baseMethod.getExcelData("incident", i + 1, d);

				/* Selecting Values from Drop Down using Select Class */
				System.out.println(label + "  " + expected);
				if (tag.equalsIgnoreCase("select")) {

					String id = baseMethod.readData("inc." + label,
							"incident.properties");
					WebElement path = Driver.driver.findElement(By.id(id));

					baseMethod.selectDropdown(path, expected);

					/* Inserting Data into Input Fields */

			} else if (tag.equalsIgnoreCase("input")||tag.equalsIgnoreCase("textarea")) {
				String id = baseMethod.readData("inc."+label, "incident.properties");
				Driver.driver.findElement(By.id(id)).sendKeys(expected);
				/* For Selecting Link And navigating to other Window/Tab */
			} else if (tag.equalsIgnoreCase("a")) {
				String id = baseMethod.readData("inc."+label, "incident.properties");

				Driver.driver.findElement(By.id(id)).click();
				Set<String> set = Driver.driver.getWindowHandles();
				Iterator<String> itr = set.iterator();
				String parent = itr.next();
				String child = itr.next();
				Driver.driver.switchTo().window(child);
				baseMethod.pageLoadWait();
				Thread.sleep(5000);
				
try{
					

					String dropDown = ele.getSearchDropDown()
							.getAttribute("id");
					WebElement dropdown = Driver.driver.findElement(By
							.id(dropDown));

					baseMethod.selectDropdown(dropdown, "Name");
					Thread.sleep(2000);

					String inputElement = ele.getSearchInputEdit()
							.getAttribute("id");

					Driver.driver.findElement(By.id(inputElement)).sendKeys(
							expected);
					Thread.sleep(3000);
					baseMethod.actions();
					baseMethod.pageLoadWait();
					Thread.sleep(5000);

					baseMethod.selectFromList(ele.getCallerWindowList(),
							expected);

					Thread.sleep(3000);
					Driver.driver.switchTo().window(parent);
					Driver.driver.switchTo().defaultContent();
					baseMethod.switchTo().defaultContent();
					//Driver.driver.switchTo().frame("gsft_main");
					baseMethod.switchToMainFrame();

}catch(Exception e){
	
	
						Driver.driver.findElement(
								By.xpath("//tbody/tr/td[3]/a[contains(text(),'"
										+ expected + "')]")).click();
						Thread.sleep(3000);

					}
					/* Invalid Tag name Throws Error */
				} else {
					System.out.println();
				
				}

				Thread.sleep(3000);
			} catch (Exception e) {
				System.out.println();
			}
		}
		Thread.sleep(3000);

		try {

			String id = baseMethod.readData("inc.Update", "incident.properties");
			Driver.driver.findElement(By.id(id)).click();

		} catch (Exception e) {
			String id = baseMethod.readData("inc.Save", "incident.properties");
			Driver.driver.findElement(By.id(id)).click();
		}

	}
	/*
	 * Fetching Number Of Status count to update and starts updating One by One State
	 * Step 1:Fetching Status from excel sheet
	 * Step 2:Passing status value to IncidentUpdate Method
	 * Step 3:After Update Opening Existing Ticket for Verification
	 * Step 4:This Loop continues till Status updations completes
	 * 
	 */
	public void incidentStatusUpdate() throws EncryptedDocumentException,
			InvalidFormatException, IOException, InterruptedException {

		int lastCellNumber = baseMethod.getLastCellNumber("incident");
		Elements ele = PageFactory.initElements(Driver.driver, Elements.class);

		baseMethod.extractElement(ele.getUpdateButtonsList(), "inc.update1",
				"inc.update2", "inc");

		for (int i = 0; i < lastCellNumber; i++) {

			int statusColumCount = i + 3;

			this.IncidentUpdate(statusColumCount);

			String ticket = baseMethod.readData("ticketNumber",
					"incident.properties");
			filter.openExistingTicket(ticket,"incident");
			baseMethod.pageLoadWait();
			Thread.sleep(5000);
			if (statusColumCount == lastCellNumber - 1) {
				break;
			}
		}

	}
}
