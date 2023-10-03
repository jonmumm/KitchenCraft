# Data Modeling in Redis for Recipe Chats

## Data Structures

### 1. User Information

- **Key**: `user:<user_id>`
- **Type**: Hash
- **Fields**:
  - `username`: The username of the user.
  - `email`: The email of the user.

#### Example Usage:

```shell
HSET user:1001 username "JohnDoe" email "john@example.com"
```

### 2. Chats

- **Key**: `chat:<chat_id>`
- **Type**: Hash
- **Fields**:
  - `user_id`: Reference to the user.
  - `recipe_id`: Reference to the recipe.
  - `query`: Initial query from the user.
  - `ingredients`: Ingredients specified by the user.
  - `cuisines`: Cuisines specified by the user.
  - `techniques`: Techniques specified by the user.
  - `cookwares`: Cookwares specified by the user.
  - `cook_time`: Cook time specified by the user.

#### Example Usage:

```shell
HSET chat:2001 user_id 1001 recipe_id 3001 query "How to make pasta?" ingredients "pasta, tomato sauce" cuisine "Italian" cook_time "30min"
```

### 3. Chat Messages

- **Key**: `chat:<chat_id>:messages`
- **Type**: List
- **Value**: JSON string containing information about each message (e.g., sender, message content, timestamp).

#### Example Usage:

```shell
LPUSH chat:2001:messages '{"sender":"user", "message":"How to make pasta?", "timestamp":"1633162800"}'
LPUSH chat:2001:messages '{"sender":"bot", "message":"Sure, here is a recipe for making pasta...", "timestamp":"1633162810"}'
```

### 4. Recipes

- **Key**: `recipe:<recipe_id>`
- **Type**: Hash
- **Fields**:
  - `name`: The name of the recipe.
  - `cuisine`: The type of cuisine.
  - `ingredients`: List of ingredients.
  - `instructions`: Cooking instructions.
  - `cook_time`: Time required to cook.
  - `image_url`: URL of the image representing the recipe.

#### Example Usage:

```shell
HSET recipe:3001 name "Pasta" cuisine "Italian" ingredients "pasta, tomato sauce, olive oil, garlic" instructions "Boil water, cook pasta, make sauce..." cook_time "30min" image_url "http://example.com/pasta.jpg"
```
