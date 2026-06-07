use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomCommandItem {
    pub id: String,
    pub title: String,
    pub description: String,
    pub command: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomCommandsPayload {
    pub items: Vec<CustomCommandItem>,
    pub storage_path: String,
    pub exists: bool,
}
