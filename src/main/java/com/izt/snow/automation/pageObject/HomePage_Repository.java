package com.izt.snow.automation.pageObject;

import java.util.List;

import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindAll;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.FindBys;

/**
 * 
 * @author Bharath
 * 
 */
/* Home Page Web Elements */
public class HomePage_Repository {

	@FindBy(xpath = "//input[@id='filter']")
	private WebElement filterNavigaterEdit;

	@FindAll({@FindBy(xpath = "//span[a[contains(text(),'Incident')]]/following-sibling::ul/li/a")})
	private List<WebElement> incidentSubMenuList;
	
	@FindAll({@FindBy(xpath = "//span[a[contains(text(),'Problem')]]/following-sibling::ul/li/a")})
	private List<WebElement> problemSubMenuList;

	@FindBy(xpath = "//button[@id='user_info_dropdown']")
	private WebElement userInfoDropDownButton;

	@FindBy(xpath = "//button[@id='user_info_dropdown']/following-sibling::ul/descendant::a[contains(text(),'Profile')]")
	private WebElement profileLink;

	@FindBy(xpath = "//button[@id='user_info_dropdown']/following-sibling::ul/descendant::a[contains(text(),'Logout')]")
	private WebElement logoutLink;
	
	@FindBy(xpath="//button[contains(text(),'Logout')]")
	private WebElement logoutButton;
	
	
	@FindBy(xpath = "//span[contains(text(),'Go to')]/following-sibling::div/div/input")
	private WebElement searchGoToEdit;

	@FindBy(xpath = "//span[contains(text(),'Go to')]/following-sibling::div/div/span/span/select")
	private WebElement goToSearchDropDown;

	@FindBy(xpath="//button[@id='nav-settings-button']")
	private WebElement settingsButtonUI16;
	
	@FindBy(xpath="//a[@href='#settings_form']")
	private WebElement formTabUI16;
	
	@FindBy(xpath="//div[contains(text(),'Tabbed forms')]/following-sibling::div/descendant::label")
	private WebElement tabbedFormButtonUI16;
	
	@FindBy(xpath="//button[@class='btn close icon-cross']")
	private WebElement closeButtonUI16;
	
	@FindBy(xpath="//button[@id='navpage_header_control_button']")
	private WebElement settingsButtonUI15;
	
	@FindBy(xpath="//label[contains(text(),'Tabbed forms')]/following-sibling::div/label")
	private WebElement tabbedFormButtonUI15;
	
	
	
	
	public WebElement getSettingsButtonUI16() {
		return settingsButtonUI16;
	}


	public WebElement getFormTabUI16() {
		return formTabUI16;
	}


	public WebElement getTabbedFormButtonUI16() {
		return tabbedFormButtonUI16;
	}


	public WebElement getCloseButtonUI16() {
		return closeButtonUI16;
	}


	public WebElement getSettingsButtonUI15() {
		return settingsButtonUI15;
	}


	public WebElement getTabbedFormButtonUI15() {
		return tabbedFormButtonUI15;
	}


	public WebElement getLogoutButton() {
		return logoutButton;
	}


	public WebElement getSearchGoToEdit() {
		return searchGoToEdit;
	}


	public WebElement getGoToSearchDropDown() {
		return goToSearchDropDown;
	}


	public WebElement getFilterNavigaterEdit() {
		return filterNavigaterEdit;
	}

	
	public List<WebElement> getIncidentSubMenuList() {
		return incidentSubMenuList;
	}

	public List<WebElement> getProblemSubMenuList() {
		return problemSubMenuList;
	}

	public WebElement getUserInfoDropDownButton() {
		return userInfoDropDownButton;
	}

	public WebElement getProfileLink() {
		return profileLink;
	}

	public WebElement getLogoutLink() {
		return logoutLink;
	}

}
