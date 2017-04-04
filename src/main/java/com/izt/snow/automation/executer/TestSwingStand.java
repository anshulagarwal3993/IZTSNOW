package com.izt.snow.automation.executer;

import net.miginfocom.swing.MigLayout;

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.MouseEvent;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

import javax.swing.DefaultComboBoxModel;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JPopupMenu;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.border.TitledBorder;

import java.awt.BorderLayout;
import java.awt.EventQueue;

import javax.swing.JFormattedTextField;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.border.EmptyBorder;
import javax.swing.JLabel;

import com.izt.snow.automation.webdriver.BaseClass;
import com.jgoodies.forms.factories.DefaultComponentFactory;

import javax.swing.SwingConstants;

import java.awt.FlowLayout;

import javax.swing.JComboBox;

import java.awt.Font;




import com.jgoodies.forms.layout.FormLayout;
import com.jgoodies.forms.layout.ColumnSpec;
import com.jgoodies.forms.layout.FormSpecs;
import com.jgoodies.forms.layout.RowSpec;

public class TestSwingStand extends JFrame {

	private JPanel contentPane;
	private JTextField textField;
	private JTextField textField_1;
	private JTextField txtDownload;
	private JComboBox<String> comboBox;
	private JTextField textField_2;
	private JTextField textField_3;
	private JTextField textField_4;
	BaseClass baseMethod=new BaseClass();
	ExecuteScripts execute=new ExecuteScripts();

	/**
	 * Launch the application.
	 */
	public static void main(String[] args) {
		EventQueue.invokeLater(new Runnable() {
			public void run() {
				try {
					TestSwingStand frame = new TestSwingStand();
					frame.setVisible(true);
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		});
	}

	/**
	 * Create the frame.
	 */
	public TestSwingStand() {

		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		setBounds(100, 100, 728, 466);
		contentPane = new JPanel();
		setContentPane(contentPane);
		contentPane.setLayout(new MigLayout("", "[grow]", "[][][grow]"));
		JPanel panel = new JPanel();
		contentPane.add(panel, "cell 0 0,alignx center,growy");

		JLabel lblExecutor = new JLabel("IZT Automation Console");
		lblExecutor.setFont(new Font("Arial Narrow", Font.BOLD, 12));
		panel.add(lblExecutor);

		JPanel panel_1 = new JPanel();
		panel_1.setBorder(new TitledBorder(null, "Configuration",
				TitledBorder.LEADING, TitledBorder.TOP, null, null));
		contentPane.add(panel_1, "cell 0 2,grow");
		panel_1.setLayout(new FormLayout(new ColumnSpec[] {
				FormSpecs.UNRELATED_GAP_COLSPEC, ColumnSpec.decode("71px"),
				ColumnSpec.decode("33px"), ColumnSpec.decode("65px:grow"), },
				new RowSpec[] { RowSpec.decode("23px"), RowSpec.decode("20px"),
						FormSpecs.LABEL_COMPONENT_GAP_ROWSPEC,
						RowSpec.decode("20px"),
						FormSpecs.LABEL_COMPONENT_GAP_ROWSPEC,
						FormSpecs.DEFAULT_ROWSPEC, RowSpec.decode("23px"),
						FormSpecs.DEFAULT_ROWSPEC, FormSpecs.DEFAULT_ROWSPEC,
						FormSpecs.DEFAULT_ROWSPEC, }));

		JLabel lblBrowser = new JLabel("Browser");
		panel_1.add(lblBrowser, "2, 2, left, center");

		comboBox = new JComboBox<String>();
		comboBox.setModel(new DefaultComboBoxModel<String>(new String[] {
				"Chrome", "Firefox", "IExplore" }));
		panel_1.add(comboBox, "4, 2, left, top");

		JLabel lblModules = new JLabel("Modules");
		panel_1.add(lblModules, "2, 4, left, center");

		comboBox = new JComboBox<String>();
		comboBox.setModel(new DefaultComboBoxModel<String>(new String[] { "IM",
				"PM", "CM" }));
		panel_1.add(comboBox, "4, 4, left, top");

		final JButton btnNewButton = new JButton("Execute");
		btnNewButton.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent arg0) {

				/* Checking Action for button Clicks */

				JFrame parent = new JFrame();

				JOptionPane.showMessageDialog(parent, "Clicked");
			
				
				String urltextFieldValue = textField_2.getText();
				String userNametextFieldValue = textField_3.getText();
				String passwordtextFieldValue = textField_4.getText();
				
				int module=	comboBox.getSelectedIndex();
				
				baseMethod.addData("URL", urltextFieldValue, "home.properties");
				baseMethod.addData("UserName", userNametextFieldValue, "home.properties");
				baseMethod.addData("Password", passwordtextFieldValue, "home.properties");
				execute.performExecution(module+"");
				

				/*
				 * String f1 = textField_2.getText(); String f2 =
				 * textField_3.getText(); String f3 = textField_4.getText();
				 * JOptionPane.showMessageDialog(parent, f3 +f2 +f1);
				 */
			}
		});

		JLabel lblUrl = DefaultComponentFactory.getInstance()
				.createLabel("URL");
		panel_1.add(lblUrl, "2, 6");

		textField_2 = new JTextField();
		textField_2.setHorizontalAlignment(SwingConstants.CENTER);
		panel_1.add(textField_2, "4, 6, left, default");
		textField_2.setColumns(10);

		/* sid - fetching values for URL field */

		String urltextFieldValue = textField_2.getText();

		JLabel lblUserName = DefaultComponentFactory.getInstance().createLabel(
				"User Name");
		panel_1.add(lblUserName, "2, 7");

		textField_3 = new JTextField();
		panel_1.add(textField_3, "4, 7, left, default");
		textField_3.setColumns(10);

		/* Fetch the value for User Name Field */

		String userNametextFieldValue = textField_3.getText();

		JLabel lblPassword = DefaultComponentFactory.getInstance().createLabel(
				"Password");
		panel_1.add(lblPassword, "2, 8");

		textField_4 = new JTextField();
		panel_1.add(textField_4, "4, 8, left, default");
		textField_4.setColumns(10);
		panel_1.add(btnNewButton, "2, 10, left, top");

		/* Fetch the Value for Password Field */

		String passwordtextFieldValue = textField_4.getText();
	}

	/* Creating Desktop Icon */

	void createDesktopIcon() {

	}

	private String getRelativePath(String path) {
		if (path.equals(new File("").getAbsolutePath()))
			return ".";
		return path.replace(new File("").getAbsolutePath(), "").substring(1);
	}

	protected JTextField getProfilePathTF() {
		return textField_1;
	}

	protected JTextField getUserNameTextField() {
		return textField_3;
	}

	protected JTextField getPasswordTextField() {
		return textField_4;
	}

	protected JTextField getURLTextField() {
		return textField_2;
	}

}
