terraform {
  backend "s3" {
    bucket = "tbm-tf-state-bucket"
    key    = "listpal_dev"
    region = "eu-west-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.35.0"
    }
  }

  required_version = ">= 0.14.0"
}

provider "aws" {
  region = "eu-west-2"
}

locals {
  project_name         = "listpal-dev"
  domain_name          = "listpal.dev.vinsp.in"
  root_domain_name     = "vinsp.in"
  allowed_locations    = ["GB"]
  forward_query_string = true
  common_tags = {
    Project = "listpal.dev.vinsp.in"
  }
}

module "static-website" {
  source = "git@github.com:TomBenjaminMorris/tf-modules.git//static-website?ref=static-website-v0.0.15"

  project_name         = local.project_name
  domain_name          = local.domain_name
  root_domain_zone     = local.root_domain_name
  allowed_locations    = local.allowed_locations
  common_tags          = local.common_tags
  forward_query_string = local.forward_query_string
}
