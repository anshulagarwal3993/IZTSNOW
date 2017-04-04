package com.izt.snow.automation.functionLibrary;

import java.io.IOException;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import com.izt.snow.automation.pageObject.Elements;
import com.izt.snow.automation.webdriver.BaseClass;
import com.izt.snow.automation.webdriver.Driver;

/**
 * 
 * @author Bharath
 * 
 */
public class PM {

	BaseClass baseMethod = new BaseClass();
	Filter_Navigator filter=new Filter_Navigator();
	WebDriverWait wait=new WebDriverWait(Driver.driver, 10);

	/**
	 * Step 1: Fetching Label From Excel Sheet (User Input)
	 * Step 2: Based on User Input, searches for  Label Tag Name from Properties file
	 * Step 3: Based on Tag Name driver control passes 
	 * Step 4: Action Take place with Expected Value Selected by User
	 * 
	 * @throws EncryptedDocumentException
	 * @throws InvalidFormatException
	 * @throws IOException
	 * @throws InterruptedException
	 */
	public void problemDataInsertion() throws EncryptedDocumentException,
			InvalidFormatException, IOException, InterruptedException {
		Elements ele = PageFactory.initElements(Driver.driver, Elements.class);

		/* Sheet name should change */
		String SheetName = "problem";

		int lastRowCount = baseMethod.getLastRowNumber(SheetName);

		Driver.driver.switchTo().defaultContent();
		Driver.driver.switchTo().frame("gsft_main");

		String problemNumber = ele.getProblemNumber().getAttribute("value");
		System.out.println(problemNumber);
		baseMethod.addData("problemNumber", problemNumber,
				"problem.properties");

		for (int i = 0; i < lastRowCount; i++) {
try{
			String label = "prb."
					+ baseMethod.getExcelData("problem", i + 1, 1).replace(" ",
							"");

			String element = label + "Tag";

			String tag = baseMethod.readData(element, "problem.properties");

			String expected = baseMethod.getExcelData(SheetName, i + 1, 2);

			/* For Select Drop down Fileds */
			if (tag.equalsIgnoreCase("select")) {
				String id = baseMethod.readData(label, "problem.properties");
				WebElement path = Driver.driver.findElement(By.id(id));

				baseMethod.selectDropdown(path, expected);

				/* For Input and TextArea Fields */
			} else if (tag.equalsIgnoreCase("input")
					|| tag.equalsIgnoreCase("textarea")) {
				String id = baseMethod.readData(label, "problem.properties");
				Driver.driver.findElement(By.id(id)).sendKeys(expected);
				/* For clicking link */
			} else if (tag.equalsIgnoreCase("a")) {
				String id = baseMethod.readData(label, "problem.properties");
				Driver.driver.findElement(By.id(id)).click();
				Thread.sleep(3000);
				Set<String> set = Driver.driver.getWindowHandles();
				Iterator<String> itr = set.iterator();
				Thread.sleep(3000);
				String parent = itr.next();
				String child = itr.next();
				Driver.driver.switchTo().window(child);
				baseMethod.pageLoadWait();
				Thread.sleep(3000);

				try {

					Driver.driver.findElement(
							By.xpath("//tbody/tr/td[3]/a[contains(text(),'"
									+ expected + "')]")).click();
					
					

				} catch (Exception e) {

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
					Thread.sleep(2000);
					baseMethod.actions();
					baseMethod.pageLoadWait();
					Thread.sleep(2000);

					baseMethod.selectFromList(ele.getCallerWindowList(),
							expected);

				}
				Driver.driver.switchTo().window(parent);
				Driver.driver.switchTo().defaultContent();
				Driver.driver.switchTo().frame("gsft_main");
				baseMethod.pageLoadWait();
				Thread.sleep(3000);
				

				/* Invalid Tag name Throws Error */
			} else {
				
			}

			Thread.sleep(5000);
			
}catch(Exception e){
	
}
		}
		ele.getProblemShortDescription().sendKeys("test");

		
		Thread.sleep(5000);
		try {
			String id = baseMethod.readData("prb.Submit", "problem.properties");
			Driver.driver.findElement(By.id(id)).click();

		} catch (Exception e) {
			String id = baseMethod.readData("prb.Save", "problem.properties");
			Driver.driver.findElement(By.id(id)).click();
		}
		Thread.sleep(5000);

	}
	
	public void problemUpdate(int cellNum) throws EncryptedDocumentException, InvalidFormatException, IOException, InterruptedException{
		
		
		Elements ele = PageFactory.initElements(Driver.driver, Elements.class);

		/* Sheet name should change */
		String SheetName = "problem";

		int lastRowCount = baseMethod.getLastRowNumber(SheetName);

		Driver.driver.switchTo().defaultContent();
		Driver.driver.switchTo().frame("gsft_main");
		try {

			String id = baseMethod.readData("prb.State", "problem.properties");
			WebElement path = Driver.driver.findElement(By.id(id));
			String expected = baseMethod.getExcelData("problem", 0, cellNum);
			baseMethod.selectDropdown(path, expected);
		} catch (Exception e) {

			String id = baseMethod
					.readData("prb.Status", "problem.properties");
			WebElement path = Driver.driver.findElement(By.id(id));
			String expected = baseMethod.getExcelData("problem", 0, cellNum);
			baseMethod.selectDropdown(path, expected);
		}
		
		for (int i = 0; i < lastRowCount; i++) {
			String label = null;
	try{
			 label = "prb."
					+ baseMethod.getExcelData("problem", i + 1, 1).replace(" ",
							"");

			String element = label + "Tag";

			String tag = baseMethod.readData(element, "problem.properties");

			String expected = baseMethod.getExcelData(SheetName, i + 1, cellNum);

			
			//System.out.println(label +"  "+tag+"  "+expected);
			
			/* For Select Drop down Fileds */
			if (tag.equalsIgnoreCase("select")) {
				String id = baseMethod.readData(label, "problem.properties");
				WebElement path = Driver.driver.findElement(By.id(id));

				baseMethod.selectDropdown(path, expected);

				/* For Input Fields */
			} else if (tag.equalsIgnoreCase("input")
					|| tag.equalsIgnoreCase("textarea")) {
				String id = baseMethod.readData(label, "problem.properties");
				Driver.driver.findElement(By.id(id)).sendKeys(expected);
				/* For clicking link */
			} else if (tag.equalsIgnoreCase("a")) {
				String id = baseMethod.readData(label, "problem.properties");
				Driver.driver.findElement(By.id(id)).click();
				Thread.sleep(3000);
				Set<String> set = Driver.driver.getWindowHandles();
				Iterator<String> itr = set.iterator();
				Thread.sleep(3000);
				String parent = itr.next();
				String child = itr.next();
				Driver.driver.switchTo().window(child);
				baseMethod.pageLoadWait();
				Thread.sleep(3000);

				try {

					Driver.driver.findElement(
							By.xpath("//tbody/tr/td[3]/a[contains(text(),'"
									+ expected + "')]")).click();
					
					

				} catch (Exception e) {

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
					Thread.sleep(2000);
					baseMethod.actions();
					baseMethod.pageLoadWait();
					Thread.sleep(2000);

					baseMethod.selectFromList(ele.getCallerWindowList(),
							expected);

				}
				Driver.driver.switchTo().window(parent);
				Driver.driver.switchTo().defaultContent();
				Driver.driver.switchTo().frame("gsft_main");
				baseMethod.pageLoadWait();
				Thread.sleep(3000);
				

				/* Invalid Tag name Throws Error */
			}  
			else {
				
			}

			Thread.sleep(5000);
			
	}catch(Exception e){
		
		System.out.println(label);
		
	}
		}
				try {
			String id = baseMethod.readData("prb.Update", "problem.properties");
			Driver.driver.findElement(By.id(id)).click();

		} catch (Exception e) {
			String id = baseMethod.readData("prb.Save", "problem.properties");
			Driver.driver.findElement(By.id(id)).click();
		}

			
	}
	
	public void problemStatusUpdate() throws EncryptedDocumentException,
	InvalidFormatException, IOException, InterruptedException {
		Elements ele = PageFactory.initElements(Driver.driver, Elements.class);
int lastCellNumber = baseMethod.getLastCellNumber("problem");

baseMethod.extractElement(ele.getUpdateButtonsList(), "prb.update1",
		"prb.update2", "prb");

for (int i = 0; i < lastCellNumber; i++) {

	int statusColumCount = i + 3;
System.out.println(statusColumCount);
	this.problemUpdate(statusColumCount);

	String ticket = baseMethod.readData("problemNumber",
			"problem.properties");
	filter.openExistingTicket(ticket,"problem");
	baseMethod.pageLoadWait();
	Thread.sleep(5000);
	if (statusColumCount == lastCellNumber - 1) {
		System.out.println("went for break");
		break;
	}
}

}

}
