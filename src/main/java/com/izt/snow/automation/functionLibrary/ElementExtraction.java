package com.izt.snow.automation.functionLibrary;

import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;

import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;

import com.izt.snow.automation.pageObject.Elements;
import com.izt.snow.automation.webdriver.BaseClass;
import com.izt.snow.automation.webdriver.Driver;
/**
 * 
 * @author Bharath
 *
 */
public class ElementExtraction {

	BaseClass baseMethod = new BaseClass();
/*
 * Incident Element Extraxting From HTML
 * step 1: Extracting Element ID , Labels and Tag Names from DOM
 * Step 2: Writing Element ID and Labels to Properties Files
 * Step 3: Including Prefix for Labels
 * 
 */
	public void IncidentElements() throws EncryptedDocumentException, InvalidFormatException, IOException {
		Elements ele = PageFactory.initElements(Driver.driver, Elements.class);

		Driver.driver.switchTo().defaultContent();
		Driver.driver.switchTo().frame("gsft_main");

		baseMethod.extractElement(ele.getIncidentSelectLabels(), "inc.select1",
				"inc.select2", "inc");
		baseMethod.extractElement(ele.getIncidentLookUpWindowLabels(),
				"inc.lookUpWindow1", "inc.lookUpWindow2", "inc");
		baseMethod.extractElement(ele.getIncidentInputLabels(), "inc.input1",
				"inc.input2", "inc");
		
		baseMethod.extractElement(ele.getIncidentFooterSelectPath(), "inc.fotterSelect1",
				"inc.footerSelect2", "inc");
		
		baseMethod.extractElement(ele.getIncidentFooterTextAreaPath(), "inc.textArea1",
				"inc.textArea2", "inc");
		baseMethod.extractElement(ele.getIncidentFooterLinkPath(), "inc.footerLookUpWindow1",
				"inc.footerLookUpWindow2", "inc");
		
		
		this.incidentForm2Elements();
		
		
		List<WebElement> inc_button = ele.getIncidentButton();
		int inc_button_count = inc_button.size();

		for (int k = 0; k < inc_button_count; k++) {

			String label = inc_button.get(k).getText();

			int a = k + 1;
			try {
				String inc_button_path = "//span[@class='ui_action_container_primary']/span/button"
						+ "[" + a + "]";
				baseMethod.captureIdTag(inc_button_path, label, "inc");
			} catch (NoSuchElementException d) {
				System.out.println("no path for  - " + label);
			}

		}
	}
	/*
	 * Problem Element Extraxting From HTML
	 * step 1: Extracting Element ID , Labels and Tag Names from DOM
	 * Step 2: Writing Element ID and Labels to Properties Files
	 * Step 3: Including Prefix for Labels
	 * 
	 */
	public void problemElements() throws EncryptedDocumentException, InvalidFormatException, IOException {

		Elements ele = PageFactory.initElements(Driver.driver, Elements.class);

		Driver.driver.switchTo().defaultContent();
		Driver.driver.switchTo().frame("gsft_main");

		baseMethod.extractElement(ele.getProblemSelectDropDownElements(),
				"prb.select1", "prb.select2", "prb");
		baseMethod.extractElement(ele.getProblemAtagElements(),
				"prb.lookUpWindow1", "prb.lookUpWindow2", "prb");
		baseMethod.extractElement(ele.getProblemInputElements(), "prb.input1",
				"prb.input2", "prb");
		baseMethod.extractElement(ele.getProblemFooterTextAreaLabels(),
				"prb.textarea1", "prb.textarea2", "prb");
		List<WebElement> prb_button = ele.getProblemButtonsElement();
		int prb_button_count = prb_button.size();

		for (int k = 0; k < prb_button_count; k++) {

			String label = prb_button.get(k).getAttribute("textContent");

			int a = k + 1;
			try {
				String prb_button_Path = "//span[@class='ui_action_container_primary']/span/button"
						+ "[" + a + "]";
				baseMethod.captureIdTag(prb_button_Path, label, "prb");
			} catch (NoSuchElementException d) {
				
			}

		}

	}
	
	/*
	 * Fetching Elements from second Column Rows
	 */
	public void incidentForm2Elements() throws EncryptedDocumentException, InvalidFormatException, IOException{
		Elements ele = PageFactory.initElements(Driver.driver, Elements.class);

		Driver.driver.switchTo().defaultContent();
		Driver.driver.switchTo().frame("gsft_main");
		List<WebElement> incidentRowList = ele.getCreateIncidentDivRows();
		int incidentRowList_count = incidentRowList.size();
		
		for (int i = 0; i < incidentRowList_count; i++) {
			List<WebElement> labels_List = null;
			if (incidentRowList_count == 2) {

				labels_List = ele.getLabelsList();

			} else if (incidentRowList_count == 3) {

				labels_List = ele.getLabelsList1();

			}

			int count = labels_List.size();
			for (int j = 0; j < count; j++) {

				String label = labels_List.get(j).getAttribute("textContent");
				
				try {

					String path = baseMethod.readData("inc.div",
							"xpath.properties")
							+ label
							+ baseMethod.readData("inc.div2",
									"xpath.properties");

					baseMethod.captureIdTag(path, label, "inc");
					
				} catch (Exception e) {

					try {

						String path = baseMethod.readData("inc.div",
								"xpath.properties")
								+ label
								+ baseMethod.readData("inc.div1",
										"xpath.properties");

						baseMethod.captureIdTag(path, label, "inc");
						
					} catch (Exception a) {

						String path = baseMethod.readData("inc.div",
								"xpath.properties")
								+ label
								+ baseMethod.readData("inc.div3",
										"xpath.properties");

						baseMethod.captureIdTag(path, label, "inc");
						
					}
				}

			}

			break;

		}
	}
	


}
