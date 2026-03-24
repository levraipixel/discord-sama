variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "eu-west-3"
}

variable "discord_public_key" {
  description = "Discord application public key used to verify incoming interaction payloads"
  type        = string
  sensitive   = true
}

variable "discord_bot_token" {
  description = "Discord bot token used to send DMs"
  type        = string
  sensitive   = true
}

variable "discord_app_id" {
  description = "Discord application ID used to edit deferred interaction responses"
  type        = string
}

variable "command_id_remind_1h" {
  description = "Discord command ID for 'Remind me in 1 hour'"
  type        = string
}

variable "command_id_remind_tomorrow" {
  description = "Discord command ID for 'Remind me tomorrow'"
  type        = string
}

variable "command_id_remind_date" {
  description = "Discord command ID for 'Remind me on specific date'"
  type        = string
}

variable "command_id_save_later" {
  description = "Discord command ID for 'Save for later'"
  type        = string
}

variable "project_name" {
  description = "Name prefix applied to all created resources"
  type        = string
  default     = "discord-sama"
}

variable "environment" {
  description = "Deployment environment (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production"
  }
}
