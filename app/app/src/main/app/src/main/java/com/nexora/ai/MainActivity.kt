
package com.nexora.ai

import android.app.Activity
import android.app.AlertDialog
import android.os.Bundle
import android.graphics.Color
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

class MainActivity : Activity() {

    private val prefs by lazy {
        getSharedPreferences("nexora_settings", MODE_PRIVATE)
    }

    private lateinit var titleText: TextView
    private lateinit var messageInput: EditText
    private lateinit var responseText: TextView

    private val purple = Color.rgb(126, 67, 255)
    private val backgroundColor = Color.rgb(15, 15, 25)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        showHome()
    }

    private fun assistantName(): String {
        return prefs.getString("assistant_name", "Nexora")
            ?: "Nexora"
    }

    private fun makeButton(
        text: String,
        action: () -> Unit
    ): Button {
        return Button(this).apply {
            this.text = text
            setTextColor(Color.WHITE)
            setBackgroundColor(purple)
            setOnClickListener { action() }
        }
    }

    private fun showHome() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(24, 36, 24, 24)
            setBackgroundColor(backgroundColor)
        }

        titleText = TextView(this).apply {
            text = "NEXORA AI"
            textSize = 30f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
        }
        root.addView(titleText)

        val subtitle = TextView(this).apply {
            text = "Your personal AI assistant"
            textSize = 16f
            setTextColor(Color.LTGRAY)
            gravity = Gravity.CENTER
        }
        root.addView(subtitle)

        val settingsButton = makeButton("Personalization Settings") {
            showSettings()
        }
        root.addView(
            settingsButton,
            LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = 28 }
        )

        messageInput = EditText(this).apply {
            hint = "Type a message..."
            setHintTextColor(Color.GRAY)
            setTextColor(Color.WHITE)
            textSize = 16f
        }
        root.addView(
            messageInput,
            LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = 20 }
        )

        root.addView(
            makeButton("Send") {
                val message = messageInput.text.toString().trim()
                if (message.isNotEmpty()) {
                    responseText.text =
                        "Message received. AI connection will be added in a later step."
                    messageInput.text.clear()
                } else {
                    Toast.makeText(
                        this,
                        "Type a message first.",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            },
            LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        )

        responseText = TextView(this).apply {
            text = "Your assistant is ready to be configured."
            textSize = 16f
            setTextColor(Color.WHITE)
            setPadding(0, 24, 0, 0)
        }
        root.addView(responseText)

        setContentView(root)
    }

    private fun showSettings() {
        val nameInput = EditText(this).apply {
            setText(assistantName())
            hint = "Enter your assistant's name"
            setSingleLine(true)
        }

        AlertDialog.Builder(this)
            .setTitle("Personalization")
            .setMessage("Choose the name this device uses for your assistant.")
            .setView(nameInput)
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Save") { _, _ ->
                val newName = nameInput.text.toString().trim()

                if (newName.isNotEmpty()) {
                    prefs.edit()
                        .putString("assistant_name", newName)
                        .apply()

                    titleText.text = "NEXORA AI"
                    Toast.makeText(
                        this,
                        "Assistant name saved: $newName",
                        Toast.LENGTH_SHORT
                    ).show()
                } else {
                    Toast.makeText(
                        this,
                        "Please enter a name.",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
            .show()
    }
}
