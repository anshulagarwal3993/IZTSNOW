package com.izt.snow.automation.pageObject;

import java.util.List;

import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.FindBys;

/**
 * 
 * @author Bharath
 * 
 */

/*
 * WebElements Xpaths
 */
public class Elements {

	@FindBys({ @FindBy(xpath = "//div[@id='bf1d96e3c0a801640190725e63f8ac80']/descendant::div[@class='vsplit col-sm-6']/div/div[2]/select/parent::div/preceding-sibling::div/label/span[2]") })
	private List<WebElement> incidentSelectLabels;

	@FindBys({ @FindBy(xpath = "//div[@id='tabs2_section']/following-sibling::span/span/div/div/div/descendant::select/parent::div/preceding-sibling::div/label/span[2]") })
	private List<WebElement> incidentFooterSelectPath;

	@FindBy(id = "incident.short_description")
	private WebElement shortDescriptionEdit;

	@FindBy(xpath = "//div[@id='page_timing_div']/i")
	private WebElement responseTimeView;

	@FindBy(xpath = "//div[@id='page_timing_div']/button")
	private WebElement responseTimeButton;

	@FindBys({ @FindBy(xpath = "//div[@id='tabs2_section']/following-sibling::span/span/div/div/div/descendant::select/parent::div/preceding-sibling::div/label/span[2]") })
	private List<WebElement> footerSelectDropDownPath;

	@FindBys({ @FindBy(xpath = "//div[@id='tabs2_section']/following-sibling::span/span/div/div/div/descendant::textarea/parent::div/preceding-sibling::div/label/span[2]") })
	private List<WebElement> incidentFooterTextAreaPath;

	@FindBys({ @FindBy(xpath = "//div[@id='tabs2_section']/following-sibling::span/span/div/div/div/descendant::a/parent::span/parent::div/parent::div/preceding-sibling::div/label/span[2]") })
	private List<WebElement> incidentFooterLinkPath;

	@FindBy(xpath = "//div[contains(@class,'container-fluid')]/descendant::div[@class='input-group']/descendant::select")
	private WebElement searchDropDown;

	@FindBy(xpath = "//div[contains(@class,'container-fluid')]/descendant::div[@class='input-group']/input")
	private WebElement searchInputEdit;

	@FindBys({ @FindBy(xpath = "//span[@class='ui_action_container_primary']/span/button") })
	private List<WebElement> incidentButton;

	@FindBys({ @FindBy(xpath = "//table[@id='incident_table']/descendant::tr[@id='hdr_incident']/th") })
	private List<WebElement> dataTable;

	@FindBy(xpath = "//div[@id='bf1d96e3c0a801640190725e63f8ac80']/descendant::div[@class='vsplit col-sm-6']/div/div[2]/input[contains(@id,'incident.number')]")
	private WebElement Ticketnumber;

	@FindBys({ @FindBy(xpath = "//div[@id='bf1d96e3c0a801640190725e63f8ac80']/descendant::div[@class='vsplit col-sm-6']/div/div[2]/div/span/a/parent::span/parent::div/parent::div/preceding-sibling::div/label/span[2]") })
	private List<WebElement> incidentLookUpWindowLabels;

	@FindBys({ @FindBy(xpath = "//div[@id='bf1d96e3c0a801640190725e63f8ac80']/descendant::div[@class='vsplit col-sm-6']/div/div[2]/input[2 and @type!='hidden']/parent::div/preceding-sibling::div/label/span[2]") })
	private List<WebElement> incidentInputLabels;

	@FindBys({ @FindBy(xpath = "//tbody[@class='list2_body']/tr/td[3]/a") })
	private List<WebElement> callerWindowList;
	
	@FindBy(xpath="//button[@id='sysverb_update']")
	private WebElement incidentupdateButton;
	
	@FindBys({@FindBy(xpath="//div[@id='bf1d96e3c0a801640190725e63f8ac80']/div[@class='row']")})
	private List<WebElement> createIncidentDivRows;
	
	@FindBys({@FindBy(xpath="//div[@id='bf1d96e3c0a801640190725e63f8ac80']/div[2]/descendant::label/span[2]")})
	private List<WebElement> labelsList;
	
	@FindBys({@FindBy(xpath="//div[@id='bf1d96e3c0a801640190725e63f8ac80']/div[3]/descendant::label/span[2]")})
	private List<WebElement> labelsList1;
	
	@FindBys({@FindBy(xpath="//span[@class='ui_action_container_primary']/descendant::button")})
	private List<WebElement> updateButtonsList;
	
	
	
	
	

	/*----------PRB-----------*/
	@FindBys({ @FindBy(xpath = "//div[@id='bfb81dc9c0a8000900127627db594210']/descendant::div[@class='vsplit col-sm-6']/div/div[2]/select/parent::div/preceding-sibling::div/label/span[2]") })
	private List<WebElement> problemSelectDropDownElements;

	@FindBys({ @FindBy(xpath = "//div[@id='bfb81dc9c0a8000900127627db594210']/descendant::div[@class='vsplit col-sm-6']/div/div[2]/div/span/a/parent::span/parent::div/parent::div/preceding-sibling::div/label/span[2]") })
	private List<WebElement> problemAtagElements;

	@FindBys({ @FindBy(xpath = "//div[@id='bfb81dc9c0a8000900127627db594210']/descendant::div[@class='vsplit col-sm-6']/div/div[2]/input[2 and @type!='hidden']/parent::div/preceding-sibling::div/label/span[2]") })
	private List<WebElement> problemInputElements;

	@FindBys({ @FindBy(xpath = "//span[@class='ui_action_container_primary']/span/button") })
	private List<WebElement> problemButtonsElement;

	@FindBys({ @FindBy(xpath = "//div[@id='bfb81dc9c0a8000900127627db594210']/div[2]/descendant::textarea/parent::div/preceding-sibling::div/label/span[2]") })
	private List<WebElement> problemFooterTextAreaLabels;

	@FindBy(xpath = "//input[@id='problem.short_description']")
	private WebElement problemShortDescription;

	@FindBy(xpath = "//input[contains(@id,'sys_original.problem.number')]")
	private WebElement problemNumber;

	
	
	
	public List<WebElement> getUpdateButtonsList() {
		return updateButtonsList;
	}

	public List<WebElement> getLabelsList1() {
		return labelsList1;
	}

	public List<WebElement> getLabelsList() {
		return labelsList;
	}

	public List<WebElement> getCreateIncidentDivRows() {
		return createIncidentDivRows;
	}

	public WebElement getIncidentupdateButton() {
		return incidentupdateButton;
	}

	public List<WebElement> getIncidentSelectLabels() {
		return incidentSelectLabels;
	}

	public List<WebElement> getIncidentButton() {
		return incidentButton;
	}

	public List<WebElement> getIncidentInputLabels() {
		return incidentInputLabels;
	}

	public List<WebElement> getIncidentLookUpWindowLabels() {
		return incidentLookUpWindowLabels;
	}

	public List<WebElement> getProblemSelectDropDownElements() {
		return problemSelectDropDownElements;
	}

	public List<WebElement> getProblemAtagElements() {
		return problemAtagElements;
	}

	public List<WebElement> getProblemInputElements() {
		return problemInputElements;
	}

	public List<WebElement> getProblemButtonsElement() {
		return problemButtonsElement;
	}

	public List<WebElement> getProblemFooterTextAreaLabels() {
		return problemFooterTextAreaLabels;
	}

	public WebElement getProblemShortDescription() {
		return problemShortDescription;
	}

	public WebElement getProblemNumber() {
		return problemNumber;
	}

	public List<WebElement> getCallerWindowList() {
		return callerWindowList;
	}

	public WebElement getTicketnumber() {
		return Ticketnumber;
	}

	public WebElement getSearchDropDown() {
		return searchDropDown;
	}

	public WebElement getSearchInputEdit() {
		return searchInputEdit;
	}

	public List<WebElement> getDataTable() {
		return dataTable;
	}

	public List<WebElement> getFooterSelectDropDownPath() {
		return footerSelectDropDownPath;
	}

	public List<WebElement> getIncidentFooterSelectPath() {
		return incidentFooterSelectPath;
	}

	public List<WebElement> getIncidentFooterTextAreaPath() {
		return incidentFooterTextAreaPath;
	}

	public List<WebElement> getIncidentFooterLinkPath() {
		return incidentFooterLinkPath;
	}

	public WebElement getShortDescriptionEdit() {
		return shortDescriptionEdit;
	}

	public WebElement getResponseTimeView() {
		return responseTimeView;
	}

	public WebElement getResponseTimeButton() {
		return responseTimeButton;
	}

}
